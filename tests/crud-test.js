console.log('Demarrage des tests CRUD...');

const mysql = require('mysql2/promise');

async function testCRUD() {
    let connection;
    let newUserId;
    
    try {
        // Connexion
        console.log('\n1. Test de connexion...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });
        console.log('-> Connexion etablie');

        // CREATE
        console.log('\n2. Test CREATE...');
        const [createResult] = await connection.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            ['test.crud@dadsac.org', 'test_password']
        );
        newUserId = createResult.insertId;
        console.log('-> Utilisateur cree avec ID:', newUserId);

        // READ
        console.log('\n3. Test READ...');
        const [readResult] = await connection.execute(
            'SELECT * FROM users WHERE id = ?',
            [newUserId]
        );
        console.log('-> Utilisateur lu:', readResult[0].email);

        // UPDATE
        console.log('\n4. Test UPDATE...');
        await connection.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            ['nouveau_password', newUserId]
        );
        console.log('-> Utilisateur mis a jour');

        // DELETE
        console.log('\n5. Test DELETE...');
        await connection.execute(
            'DELETE FROM users WHERE id = ?',
            [newUserId]
        );
        console.log('-> Utilisateur supprime');

        console.log('\nTous les tests CRUD ont reussi!');

    } catch (error) {
        console.error('\nERREUR:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConnexion fermee');
        }
    }
}

testCRUD();
