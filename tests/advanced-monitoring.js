console.log('SUITE DE TESTS COMPLETE DADSAC - VERSION MONITORING AVANCE');

const mysql = require('mysql2/promise');
const fs = require('fs');
const os = require('os');

class RealTimeMonitor {
    constructor() {
        this.data = [];
        this.startTime = Date.now();
        this.interval = null;
    }

    start() {
        this.interval = setInterval(() => {
            const stats = {
                timestamp: Date.now() - this.startTime,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                system: {
                    totalMem: os.totalmem(),
                    freeMem: os.freemem(),
                    loadAvg: os.loadavg()
                }
            };
            this.data.push(stats);
            this.displayStats(stats);
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    displayStats(stats) {
        const memoryUsage = (stats.memory.heapUsed / 1024 / 1024).toFixed(2);
        const cpuUser = (stats.cpu.user / 1000000).toFixed(2);
        const systemLoad = stats.system.loadAvg[0].toFixed(2);
        
        process.stdout.write('\r');
        process.stdout.write(
            'Memoire: ' + memoryUsage + 'MB | ' +
            'CPU: ' + cpuUser + 'ms | ' +
            'Charge: ' + systemLoad
        );
    }

    generateReport() {
        return {
            duration: Date.now() - this.startTime,
            samples: this.data.length,
            memory: {
                min: Math.min(...this.data.map(d => d.memory.heapUsed)),
                max: Math.max(...this.data.map(d => d.memory.heapUsed)),
                average: this.data.reduce((a, b) => a + b.memory.heapUsed, 0) / this.data.length
            },
            cpu: {
                total: this.data[this.data.length - 1].cpu.user,
                perSecond: this.data[this.data.length - 1].cpu.user / this.data.length
            },
            system: {
                averageLoad: this.data.reduce((a, b) => a + b.system.loadAvg[0], 0) / this.data.length
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
        this.monitor = new RealTimeMonitor();
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
        console.log('Demarrage du monitoring...\n');
        this.monitor.start();

        try {
            await this.connect();
            
            console.log('\n--- TESTS DE BASE ---');
            await this.runTest('Connexion BD', async () => {
                await this.connection.execute('SELECT 1');
            });

            console.log('\n--- TESTS DE CHARGE ---');
            await this.runTest('Charge 10 utilisateurs', async () => {
                const promises = Array(10).fill().map(() => 
                    this.connection.execute('SELECT 1')
                );
                await Promise.all(promises);
            });

            await this.runTest('Charge 100 utilisateurs', async () => {
                const promises = Array(100).fill().map(() => 
                    this.connection.execute('SELECT 1')
                );
                await Promise.all(promises);
            });

            console.log('\n--- TESTS DE STRESS ---');
            await this.runTest('Test stress 5 secondes', async () => {
                const duration = 5000;
                const start = Date.now();
                let operations = 0;

                while (Date.now() - start < duration) {
                    await this.connection.execute('SELECT 1');
                    operations++;
                }

                console.log('  Operations par seconde:', Math.round(operations / (duration / 1000)));
            });

            console.log('\n--- TESTS PERFORMANCE ---');
            await this.runTest('Test CPU', async () => {
                let result = 0;
                for (let i = 0; i < 1000000; i++) {
                    result += Math.sqrt(i);
                }
            });

            await this.runTest('Test Memoire', async () => {
                const arrays = [];
                for (let i = 0; i < 100; i++) {
                    arrays.push(new Array(10000).fill(Math.random()));
                }
                arrays.length = 0;
            });

        } finally {
            this.monitor.stop();
            if (this.connection) {
                await this.connection.end();
            }
        }

        this.generateReports();
    }

    generateReports() {
        const monitoringReport = this.monitor.generateReport();

        const report = {
            date: new Date().toISOString(),
            resultats: {
                reussis: this.testResults.passed,
                echoues: this.testResults.failed,
                total: this.testResults.passed + this.testResults.failed
            },
            monitoring: monitoringReport,
            details: {
                durees: this.testResults.duration,
                memoire: this.testResults.memory
            }
        };

        fs.writeFileSync('rapport-monitoring.json', JSON.stringify(report, null, 2));
        
        console.log('\n=== RAPPORT FINAL ===');
        console.log('Tests reussis:', report.resultats.reussis);
        console.log('Tests echoues:', report.resultats.echoues);
        console.log('\nRapport detaille genere: rapport-monitoring.json');
    }
}

const suite = new TestSuite();
suite.runAllTests().catch(console.error);
