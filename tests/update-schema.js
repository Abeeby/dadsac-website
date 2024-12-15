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

        // Ajout de la contrainte CHECK pour amount
        await connection.execute(
            ALTER TABLE donations 
            ADD CONSTRAINT check_positive_amount 
            CHECK (amount > 0)
        );

        console.log('Schema mis a jour avec succes');

    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

updateSchema();
