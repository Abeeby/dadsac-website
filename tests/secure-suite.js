console.log('SUITE DE TESTS COMPLETE DADSAC - VERSION SECURISEE');

const mysql = require('mysql2/promise');

class TestSuite {
    constructor() {
        this.connection = null;
        this.testResults = {
            passed: 0,
            failed: 0
        };
    }

    async connect() {
        this.connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });
    }

    async runTest(name, testFn) {
        process.stdout.write('Test ' + name + '... ');
        try {
            await testFn();
            console.log('OK');
            this.testResults.passed++;
        } catch (error) {
            console.log('ECHEC');
            console.log('Erreur:', error.message);
            this.testResults.failed++;
        }
    }

    async runAllTests() {
        try {
            await this.connect();
            
            console.log('\n--- TESTS DE BASE ---');
            await this.runTest('Connexion BD', async () => {
                await this.connection.execute('SELECT 1');
            });

            console.log('\n--- TESTS UTILISATEUR ---');
            let userId;
            await this.runTest('Creation utilisateur', async () => {
                const [result] = await this.connection.execute(
                    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
                    ['test.user@dadsac.org', 'test_password']
                );
                userId = result.insertId;
            });

            await this.runTest('Email duplique', async () => {
                try {
                    await this.connection.execute(
                        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
                        ['test.user@dadsac.org', 'autre_password']
                    );
                    throw new Error('Email duplique accepte');
                } catch (error) {
                    if (!error.message.includes('Duplicate')) throw error;
                }
            });

            console.log('\n--- TESTS DONATION ---');
            let donationId;
            await this.runTest('Creation don valide', async () => {
                const [result] = await this.connection.execute(
                    'INSERT INTO donations (user_id, amount, currency) VALUES (?, ?, ?)',
                    [userId, 250.00, 'EUR']
                );
                donationId = result.insertId;
            });

            await this.runTest('Rejet montant negatif', async () => {
                try {
                    await this.connection.execute(
                        'INSERT INTO donations (user_id, amount, currency) VALUES (?, ?, ?)',
                        [userId, -100.00, 'EUR']
                    );
                    throw new Error('Montant negatif accepte');
                } catch (error) {
                    if (!error.message.includes('check_positive_amount')) {
                        throw new Error('Erreur inattendue: ' + error.message);
                    }
                }
            });

            await this.runTest('Rejet montant zero', async () => {
                try {
                    await this.connection.execute(
                        'INSERT INTO donations (user_id, amount, currency) VALUES (?, ?, ?)',
                        [userId, 0, 'EUR']
                    );
                    throw new Error('Montant zero accepte');
                } catch (error) {
                    if (!error.message.includes('check_positive_amount')) {
                        throw new Error('Erreur inattendue: ' + error.message);
                    }
                }
            });

            console.log('\n--- TESTS STATISTIQUES ---');
            await this.runTest('Calcul statistiques', async () => {
                const [stats] = await this.connection.execute(
                    'SELECT COUNT(*) as count, SUM(amount) as total, MIN(amount) as min, MAX(amount) as max FROM donations WHERE user_id = ?',
                    [userId]
                );
                console.log('Stats detaillees:', {
                    nombre_dons: stats[0].count,
                    total: stats[0].total + ' EUR',
                    min: stats[0].min + ' EUR',
                    max: stats[0].max + ' EUR'
                });
            });

            console.log('\n--- NETTOYAGE ---');
            await this.runTest('Suppression donnees', async () => {
                await this.connection.execute('DELETE FROM donations WHERE user_id = ?', [userId]);
                await this.connection.execute('DELETE FROM users WHERE id = ?', [userId]);
            });

        } finally {
            if (this.connection) {
                await this.connection.end();
            }
        }

        this.printResults();
    }

    printResults() {
        console.log('\n=== RESULTATS FINAUX ===');
        console.log('Tests reussis:', this.testResults.passed);
        console.log('Tests echoues:', this.testResults.failed);
        console.log('Total tests:', this.testResults.passed + this.testResults.failed);
        console.log('Taux de reussite:', Math.round(this.testResults.passed / (this.testResults.passed + this.testResults.failed) * 100) + '%');
    }
}

const suite = new TestSuite();
suite.runAllTests().catch(console.error);
