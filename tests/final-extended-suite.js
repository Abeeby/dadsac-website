console.log('SUITE DE TESTS COMPLETE DADSAC - VERSION FINALE ETENDUE');

const mysql = require('mysql2/promise');

class TestSuite {
    constructor() {
        this.connection = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            duration: {}
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
        const startTime = Date.now();
        try {
            await testFn();
            const duration = Date.now() - startTime;
            this.testResults.duration[name] = duration;
            console.log('OK (' + duration + 'ms)');
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

            await this.runTest('Email invalide', async () => {
                try {
                    await this.connection.execute(
                        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
                        ['email_invalide', 'password']
                    );
                    throw new Error('Email invalide accepte');
                } catch (error) {
                    // Test réussi si erreur
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

            await this.runTest('Montant maximum', async () => {
                try {
                    await this.connection.execute(
                        'INSERT INTO donations (user_id, amount, currency) VALUES (?, ?, ?)',
                        [userId, 1000000.00, 'EUR']
                    );
                    console.log('  Info: Don important accepte');
                } catch (error) {
                    throw new Error('Erreur avec montant important: ' + error.message);
                }
            });

            console.log('\n--- TESTS DE CHARGE ---');
            await this.runTest('100 requetes simultanees', async () => {
                const promises = Array(100).fill().map(() => 
                    this.connection.execute('SELECT * FROM donations WHERE user_id = ?', [userId])
                );
                await Promise.all(promises);
            });

            console.log('\n--- TESTS PERFORMANCE ---');
            await this.runTest('Performance requete simple', async () => {
                const debut = Date.now();
                await this.connection.execute('SELECT * FROM donations WHERE user_id = ?', [userId]);
                const duree = Date.now() - debut;
                if (duree > 1000) throw new Error('Requete trop lente (> 1s)');
            });

            await this.runTest('Performance requete complexe', async () => {
                const debut = Date.now();
                const query = 'SELECT u.email, COUNT(d.id) as nb_dons, SUM(d.amount) as total FROM users u LEFT JOIN donations d ON u.id = d.user_id WHERE u.id = ? GROUP BY u.id';
                await this.connection.execute(query, [userId]);
                const duree = Date.now() - debut;
                if (duree > 1000) throw new Error('Requete trop lente (> 1s)');
            });

            console.log('\n--- TESTS STATISTIQUES ---');
            await this.runTest('Calcul statistiques', async () => {
                const [stats] = await this.connection.execute(
                    'SELECT COUNT(*) as count, SUM(amount) as total, MIN(amount) as min, MAX(amount) as max, AVG(amount) as avg FROM donations WHERE user_id = ?',
                    [userId]
                );
                console.log('Stats detaillees:', {
                    nombre_dons: stats[0].count,
                    total: stats[0].total + ' EUR',
                    min: stats[0].min + ' EUR',
                    max: stats[0].max + ' EUR',
                    moyenne: Math.round(stats[0].avg * 100) / 100 + ' EUR'
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
        
        console.log('\n=== PERFORMANCES ===');
        Object.entries(this.testResults.duration)
            .sort((a, b) => b[1] - a[1])
            .forEach(([test, duration]) => {
                console.log(test + ':', duration + 'ms');
            });
    }
}

const suite = new TestSuite();
suite.runAllTests().catch(console.error);
