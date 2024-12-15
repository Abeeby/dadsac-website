console.log('SUITE DE TESTS COMPLETE DADSAC - VERSION FINALE AVEC BENCHMARKS');

const mysql = require('mysql2/promise');
const fs = require('fs');
const os = require('os');

class Benchmark {
    static results = [];
    static baselinePerformance = null;

    static async run(testFn, iterations = 5) {
        const results = [];
        console.log('\nBenchmark (' + iterations + ' iterations)...');
        
        for(let i = 0; i < iterations; i++) {
            const start = Date.now();
            await testFn();
            const duration = Date.now() - start;
            results.push(duration);
            process.stdout.write('.');
        }
        
        const stats = {
            average: results.reduce((a,b) => a + b) / results.length,
            min: Math.min(...results),
            max: Math.max(...results)
        };

        return stats;
    }
}

class RealTimeMonitor {
    constructor() {
        this.data = [];
        this.startTime = Date.now();
        this.interval = null;
        this.lastCpu = process.cpuUsage();
    }

    start() {
        this.interval = setInterval(() => {
            const currentCpu = process.cpuUsage(this.lastCpu);
            this.lastCpu = process.cpuUsage();
            
            const stats = {
                timestamp: Date.now() - this.startTime,
                memory: process.memoryUsage(),
                cpu: currentCpu,
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
        if (this.data.length === 0) {
            return {
                duration: 0,
                samples: 0,
                memory: { min: 0, max: 0, average: 0 },
                cpu: { total: 0, average: 0 }
            };
        }

        const memoryData = this.data.map(d => d.memory.heapUsed);
        const cpuData = this.data.map(d => d.cpu.user);

        return {
            duration: Date.now() - this.startTime,
            samples: this.data.length,
            memory: {
                min: Math.min(...memoryData),
                max: Math.max(...memoryData),
                average: memoryData.reduce((a, b) => a + b, 0) / this.data.length
            },
            cpu: {
                total: cpuData.reduce((a, b) => a + b, 0),
                average: cpuData.reduce((a, b) => a + b, 0) / this.data.length
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
            memory: {},
            benchmarks: {}
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
        console.log('Demarrage des tests avec benchmarks...\n');
        this.monitor.start();

        try {
            await this.connect();
            
            console.log('\n--- TESTS DE BASE ---');
            await this.runTest('Connexion BD', async () => {
                await this.connection.execute('SELECT 1');
            });

            console.log('\n--- BENCHMARKS ---');
            this.testResults.benchmarks.basic = await Benchmark.run(async () => {
                await this.connection.execute('SELECT 1');
            }, 10);

            this.testResults.benchmarks.load = await Benchmark.run(async () => {
                await Promise.all(Array(100).fill().map(() => 
                    this.connection.execute('SELECT 1')
                ));
            }, 5);

            console.log('\n--- TESTS MEMOIRE ---');
            await this.runTest('Test memoire', async () => {
                const arrays = [];
                for (let i = 0; i < 100; i++) {
                    arrays.push(new Array(10000).fill(Math.random()));
                }
                arrays.length = 0;
                global.gc && global.gc();
            });

        } finally {
            this.monitor.stop();
            if (this.connection) {
                await this.connection.end();
            }
        }

        this.generateReport();
    }

    generateReport() {
        const monitoringReport = this.monitor.generateReport();
        const benchmarkResults = this.testResults.benchmarks;

        console.log('\n\n=== RAPPORT FINAL ===');
        console.log('Tests reussis:', this.testResults.passed);
        console.log('Tests echoues:', this.testResults.failed);
        
        console.log('\n=== BENCHMARKS ===');
        console.log('Test simple:', Math.round(benchmarkResults.basic.average) + 'ms');
        console.log('Test charge:', Math.round(benchmarkResults.load.average) + 'ms');
        
        console.log('\n=== MONITORING ===');
        console.log('Memoire moyenne:', (monitoringReport.memory.average / 1024 / 1024).toFixed(2) + 'MB');
        console.log('CPU total:', (monitoringReport.cpu.total / 1000000).toFixed(2) + 'ms');

        const report = {
            date: new Date().toISOString(),
            resultats: this.testResults,
            monitoring: monitoringReport
        };

        fs.writeFileSync('rapport-benchmark.json', JSON.stringify(report, null, 2));
        console.log('\nRapport detaille genere: rapport-benchmark.json');
    }
}

const suite = new TestSuite();
suite.runAllTests().catch(console.error);
