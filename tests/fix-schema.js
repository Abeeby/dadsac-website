console.log('MISE A JOUR SCHEMA BASE DE DONNEES');

const mysql = require('mysql2/promise');

async function updateSchema() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });

        const query = 'ALTER TABLE donations ADD CONSTRAINT check_positive_amount CHECK (amount > 0)';
        
        await connection.execute(query);
        console.log('Schema mis a jour avec succes');

    } catch (error) {
        if (error.message.includes('Duplicate')) {
            console.log('La contrainte existe deja');
        } else {
            console.error('Erreur:', error.message);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connexion fermee');
        }
    }
}

updateSchema();
