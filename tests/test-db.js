// tests/test-db.js
const mysql = require('mysql2/promise');

async function initializeDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'dadsac_test'
    });

    try {
        // Suppression des tables si elles existent
        await connection.execute('DROP TABLE IF EXISTS donations');
        await connection.execute('DROP TABLE IF EXISTS users');
        console.log('✓ Tables existantes supprimées');

        // Création de la table users
        await connection.execute(`
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✓ Table users créée');

        // Création de la table donations
        await connection.execute(`
            CREATE TABLE donations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                amount DECIMAL(10,2) NOT NULL,
                currency VARCHAR(3) DEFAULT 'EUR',
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);
        console.log('✓ Table donations créée');

        // Insertion des données de test
        await connection.execute(`
            INSERT INTO users (email, password_hash) 
            VALUES ('test@dadsac.org', 'test_hash')
        `);
        console.log('✓ Données de test insérées');

    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Exécution
console.log('🚀 Initialisation de la base de données...\n');
initializeDatabase()
    .then(() => console.log('\n✅ Base de données initialisée avec succès!\n'))
    .catch(error => {
        console.error('\n❌ Erreur:', error);
        process.exit(1);
    });