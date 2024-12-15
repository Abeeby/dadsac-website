console.log('SUITE DE TESTS COMPLETE DADSAC - VERSION FINALE AVEC MONITORING');

const mysql = require('mysql2/promise');
const fs = require('fs');

class PerformanceMonitor {
    static measurements = [];
    static memorySnapshots = [];
    static thresholds = {
        critical: 1000,
        warning: 100,
        good: 50
    };

    static track(name, duration, memory) {
        this.measurements.push({ name, duration, memory, timestamp: new Date() });
        this.memorySnapshots.push(memory);
    }

    static getStats() {
        if (this.measurements.length === 0) return null;
        const durations = this.measurements.map(m => m.duration);
        const memories = this.memorySnapshots;
        
        return {
            performance: {
                average: durations.reduce((a,b) => a + b) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations),
                total: this.measurements.length,
                slow: durations.filter(d => d > this.thresholds.warning).length
            },
            memory: {
                initial: memories[0],
                final: memories[memories.length - 1],
                peak: Math.max(...memories),
                average: memories.reduce((a,b) => a + b) / memories.length
            }
        };
    }
}

class TestSuite {
    constructor() {
        this.connection = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            duration: {},
            errors: [],
            memory: {}
        };
        this.startMemory = process.memoryUsage().heapUsed;
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
        const startMem = process.memoryUsage().heapUsed;
        
        try {
            await testFn();
            const duration = Date.now() - startTime;
            const endMem = process.memoryUsage().heapUsed;
            const memoryUsed = (endMem - startMem) / 1024 / 1024;
            
            this.testResults.duration[name] = duration;
            this.testResults.memory[name] = memoryUsed;
            
            PerformanceMonitor.track(name, duration, memoryUsed);
            
            console.log('OK (' + duration + 'ms, ' + memoryUsed.toFixed(2) + 'MB)');
            this.testResults.passed++;
        } catch (error) {
            console.log('ECHEC');
            console.log('Erreur:', error.message);
            this.testResults.failed++;
            this.testResults.errors.push({ name, error: error.message });
        }
    }

    async runAllTests() {
        try {
            console.log('Demarrage des tests...\n');
            console.log('Memoire initiale:', (this.startMemory / 1024 / 1024).toFixed(2), 'MB');
            await this.connect();
            
            console.log('\n--- TESTS DE BASE ---');
            await this.runTest('Connexion BD', async () => {
                await this.connection.execute('SELECT 1');
            });

            console.log('\n--- TESTS SECURITE ---');
            await this.runTest('Protection Injection SQL', async () => {
                const [rows] = await this.connection.execute(
                    'SELECT * FROM users WHERE email = ?',
                    ["' OR '1'='1"]
                );
                if (rows.length > 0) throw new Error('Possible faille SQL injection');
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
            await this.runTest('Creation don valide', async () => {
                await this.connection.execute(
                    'INSERT INTO donations (user_id, amount, currency) VALUES (?, ?, ?)',
                    [userId, 250.00, 'EUR']
                );
            });

            console.log('\n--- TESTS DE CHARGE ---');
            await this.runTest('Test charge (100 requetes)', async () => {
                const promises = Array(100).fill().map(() => 
                    this.connection.execute('SELECT * FROM donations WHERE user_id = ?', [userId])
                );
                await Promise.all(promises);
            });

            console.log('\n--- TESTS DE STRESS ---');
            await this.runTest('Stress test (1000 requetes)', async () => {
                const iterations = 1000;
                const batchSize = 100;
                for(let i = 0; i < iterations/batchSize; i++) {
                    await Promise.all(Array(batchSize).fill().map(() => 
                        this.connection.execute('SELECT 1')
                    ));
                }
            });

            console.log('\n--- TESTS STATISTIQUES ---');
            await this.runTest('Calcul statistiques', async () => {
                const [stats] = await this.connection.execute(
                    'SELECT COUNT(*) as count, SUM(amount) as total, MIN(amount) as min, MAX(amount) as max, AVG(amount) as avg FROM donations WHERE user_id = ?',
                    [userId]
                );
                console.log('Stats:', {
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

        this.generateReports();
    }

    generateReports() {
        this.printResults();
        this.generateDetailedReport();
    }

    printResults() {
        const endMemory = process.memoryUsage().heapUsed;
        const totalMemoryUsed = (endMemory - this.startMemory) / 1024 / 1024;

        console.log('\n=== RESULTATS FINAUX ===');
        console.log('Tests reussis:', this.testResults.passed);
        console.log('Tests echoues:', this.testResults.failed);
        console.log('Total tests:', this.testResults.passed + this.testResults.failed);
        console.log('Taux de reussite:', Math.round(this.testResults.passed / (this.testResults.passed + this.testResults.failed) * 100) + '%');
        
        const stats = PerformanceMonitor.getStats();
        console.log('\n=== PERFORMANCES ===');
        console.log('Moyenne execution:', Math.round(stats.performance.average) + 'ms');
        console.log('Tests lents:', stats.performance.slow);
        
        console.log('\n=== MEMOIRE ===');
        console.log('Utilisation totale:', totalMemoryUsed.toFixed(2) + 'MB');
        console.log('Pic memoire:', (stats.memory.peak).toFixed(2) + 'MB');
    }

    generateDetailedReport() {
        const report = {
            date: new Date().toISOString(),
            resultats: {
                reussis: this.testResults.passed,
                echoues: this.testResults.failed,
                total: this.testResults.passed + this.testResults.failed
            },
            performances: PerformanceMonitor.getStats(),
            details: {
                durees: this.testResults.duration,
                memoire: this.testResults.memory
            },
            erreurs: this.testResults.errors
        };
        
        fs.writeFileSync('rapport-complet.json', JSON.stringify(report, null, 2));
        console.log('\nRapport detaille genere: rapport-complet.json');
    }
}

const suite = new TestSuite();
suite.runAllTests().catch(console.error);
