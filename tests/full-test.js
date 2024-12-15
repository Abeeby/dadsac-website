console.log('Demarrage des tests complets...');

const mysql = require('mysql2/promise');

async function testUserAndDonations() {
    let connection;
    let userId;
    let donationId;
    
    try {
        // Connexion
        console.log('\n1. CONNEXION...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });
        console.log('-> Base de donnees connectee');

        // Test Utilisateur
        console.log('\n2. TESTS UTILISATEUR...');
        const [createUser] = await connection.execute(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)',
            ['donateur@dadsac.org', 'password123']
        );
        userId = createUser.insertId;
        console.log('-> Utilisateur cree, ID:', userId);

        // Test Donations
        console.log('\n3. TESTS DONATIONS...');
        
        // Creer un don
        const [createDonation] = await connection.execute(
            'INSERT INTO donations (user_id, amount, currency, status) VALUES (?, ?, ?, ?)',
            [userId, 100.00, 'EUR', 'pending']
        );
        donationId = createDonation.insertId;
        console.log('-> Don cree, ID:', donationId);

        // Lire le don
        const [readDonation] = await connection.execute(
            'SELECT * FROM donations WHERE id = ?',
            [donationId]
        );
        console.log('-> Don lu, montant:', readDonation[0].amount, readDonation[0].currency);

        // Mettre a jour le statut du don
        await connection.execute(
            'UPDATE donations SET status = ? WHERE id = ?',
            ['completed', donationId]
        );
        console.log('-> Statut du don mis a jour');

        // Lire les statistiques
        const [stats] = await connection.execute(
            'SELECT COUNT(*) as total_donations, SUM(amount) as total_amount FROM donations WHERE user_id = ?',
            [userId]
        );
        console.log('-> Statistiques:', stats[0]);

        // Nettoyage
        console.log('\n4. NETTOYAGE...');
        await connection.execute('DELETE FROM donations WHERE id = ?', [donationId]);
        await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
        console.log('-> Donnees de test supprimees');

        console.log('\nTous les tests ont reussi!');

    } catch (error) {
        console.error('\nERREUR:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConnexion fermee');
        }
    }
}

testUserAndDonations();
