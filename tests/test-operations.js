require('dotenv').config();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const testOperations = {
    async testUserOperations() {
        console.log('\n👤 Test des opérations utilisateur...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });

        try {
            // Test de création d'utilisateur
            const [createResult] = await connection.execute(
                'INSERT INTO users (email, password_hash) VALUES (?, ?)',
                ['new_user@dadsac.org', 'hashed_password']
            );
            console.log('✓ Création utilisateur réussie, ID:', createResult.insertId);

            // Test de lecture utilisateur
            const [users] = await connection.execute(
                'SELECT * FROM users WHERE email = ?',
                ['new_user@dadsac.org']
            );
            console.log('✓ Lecture utilisateur réussie:', users[0].email);

            // Test de mise à jour utilisateur
            await connection.execute(
                'UPDATE users SET password_hash = ? WHERE email = ?',
                ['new_password_hash', 'new_user@dadsac.org']
            );
            console.log('✓ Mise à jour utilisateur réussie');

        } catch (error) {
            console.error('Erreur utilisateur:', error);
            throw error;
        } finally {
            await connection.end();
        }
    },

    async testDonationOperations() {
        console.log('\n💰 Test des opérations de don...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });

        try {
            // Récupération de l'ID utilisateur
            const [users] = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                ['new_user@dadsac.org']
            );
            const userId = users[0].id;

            // Création d'un don
            const [createResult] = await connection.execute(
                'INSERT INTO donations (user_id, amount, currency, status) VALUES (?, ?, ?, ?)',
                [userId, 100.00, 'EUR', 'pending']
            );
            console.log('✓ Création don réussie, ID:', createResult.insertId);

            // Lecture du don
            const [donations] = await connection.execute(
                'SELECT * FROM donations WHERE user_id = ?',
                [userId]
            );
            console.log('✓ Lecture don réussie, montant:', donations[0].amount);

            // Mise à jour du statut du don
            await connection.execute(
                'UPDATE donations SET status = ? WHERE id = ?',
                ['completed', createResult.insertId]
            );
            console.log('✓ Mise à jour statut don réussie');

        } catch (error) {
            console.error('Erreur don:', error);
            throw error;
        } finally {
            await connection.end();
        }
    },

    async testJWTOperations() {
        console.log('\n🔐 Test des opérations JWT...');
        try {
            // Création d'un token
            const payload = {
                id: 1,
                email: 'new_user@dadsac.org',
                role: 'user'
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET || 'test_secret', {
                expiresIn: '1h'
            });
            console.log('✓ Token JWT créé');

            // Vérification du token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
            console.log('✓ Token JWT vérifi��:', decoded.email);

        } catch (error) {
            console.error('Erreur JWT:', error);
            throw error;
        }
    },

    async runAllTests() {
        console.log('🚀 Démarrage des tests d\'opérations...\n');
        try {
            await this.testUserOperations();
            await this.testDonationOperations();
            await this.testJWTOperations();
            console.log('\n✅ Tous les tests d\'opérations ont réussi!\n');
        } catch (error) {
            console.error('\n❌ Erreur:', error);
            process.exit(1);
        }
    }
};

// Exécution des tests
testOperations.runAllTests().catch(console.error);
