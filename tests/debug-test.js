require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('🔍 Test de connexion à la base de données...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });

        console.log('✓ Connexion établie');

        const [rows] = await connection.execute('SELECT * FROM users');
        console.log('✓ Utilisateurs trouvés:', rows.length);

        await connection.end();
        console.log('✓ Connexion fermée');

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

console.log('🚀 Démarrage du test de débogage...');
testConnection();
