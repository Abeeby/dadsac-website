console.log('Demarrage du test...');

const mysql = require('mysql2/promise');

async function testDatabase() {
    console.log('Test de connexion a la base de donnees...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });
        
        console.log('Connexion reussie!');
        
        // Test simple
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('Requete test reussie');
        
        // Test table users
        const [users] = await connection.execute('SELECT * FROM users');
        console.log('Nombre utilisateurs dans la base:', users.length);
        
        await connection.end();
        console.log('Connexion fermee proprement');
        
    } catch (error) {
        console.error('ERREUR:', error.message);
    }
}

testDatabase();
