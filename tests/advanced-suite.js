console.log('SUITE DE TESTS COMPLETE DADSAC - VERSION FINALE AVANCEE');

const mysql = require('mysql2/promise');
const fs = require('fs');
const os = require('os');

class PerformanceMetrics {
    constructor() {
        this.measurements = [];
        this.startTime = process.hrtime.bigint();
    }

    mark(label) {
        const timestamp = process.hrtime.bigint();
        const duration = Number(timestamp - this.startTime) / 1e6;
        this.measurements.push({ label, duration, timestamp });
    }

    getStats() {
        if (this.measurements.length === 0) return null;

        const durations = this.measurements.map(m => m.duration);
        durations.sort((a, b) => a - b);

        return {
            min: durations[0],
            max: durations[durations.length - 1],
            avg: durations.reduce((a, b) => a + b) / durations.length,
            median: durations[Math.floor(durations.length / 2)],
            p95: durations[Math.floor(durations.length * 0.95)],
            p99: durations[Math.floor(durations.length * 0.99)]
        };
    }
}

class LoadTester {
    constructor(connection) {
        this.connection = connection;
        this.metrics = new PerformanceMetrics();
    }

    async runTest(concurrency, duration = 5000) {
        const startTime = Date.now();
        let operations = 0;
        const results = [];

        console.log('Test de charge: ' + concurrency + ' connexions simultanees pendant ' + duration + 'ms');

        while (Date.now() - startTime < duration) {
            const batch = Array(concurrency).fill().map(() => {
                const start = process.hrtime.bigint();
                return this.connection.execute('SELECT 1')
                    .then(() => {
                        const end = process.hrtime.bigint();
                        this.metrics.mark('query');
                        return Number(end - start) / 1e6;
                    });
            });

            const batchResults = await Promise.all(batch);
            results.push(...batchResults);
            operations += concurrency;
            process.stdout.write('.');
        }

        const totalTime = Date.now() - startTime;
        const stats = this.metrics.getStats();

        return {
            operations,
            duration: totalTime,
            opsPerSecond: Math.round(operations / (totalTime / 1000)),
            latency: stats
        };
    }
}

class SystemMonitor {
    constructor() {
        this.samples = [];
        this.startTime = process.hrtime.bigint();
        this.lastCpu = process.cpuUsage();
    }

    sample() {
        const cpu = process.cpuUsage(this.lastCpu);
        this.lastCpu = process.cpuUsage();

        const memory = process.memoryUsage();
        const system = {
            loadAvg: os.loadavg(),
            freeMem: os.freemem(),
            totalMem: os.totalmem()
        };

        this.samples.push({ cpu, memory, system, timestamp: Date.now() });
    }

    start(interval = 1000) {
        this.interval = setInterval(() => this.sample(), interval);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    getStats() {
        if (this.samples.length === 0) return null;

        const memory = this.samples.map(s => s.memory.heapUsed);
        const cpu = this.samples.map(s => s.cpu.user);

        return {
            memory: {
                min: Math.min(...memory) / 1024 / 1024,
                max: Math.max(...memory) / 1024 / 1024,
                avg: (memory.reduce((a, b) => a + b) / memory.length) / 1024 / 1024
            },
            cpu: {
                avg: (cpu.reduce((a, b) => a + b) / cpu.length) / 1000,
                total: cpu.reduce((a, b) => a + b) / 1000
            },
            system: {
                avgLoad: this.samples.reduce((a, b) => a + b.system.loadAvg[0], 0) / this.samples.length
            }
        };
    }
}

class TestSuite {
    constructor() {
        this.connection = null;
        this.monitor = new SystemMonitor();
        this.results = {
            tests: [],
            loadTests: [],
            systemMetrics: null
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

    async runTest(name, fn) {
        process.stdout.write('Test ' + name + '... ');
        const startTime = process.hrtime.bigint();
        const startMem = process.memoryUsage().heapUsed;

        try {
            await fn();
            const endTime = process.hrtime.bigint();
            const endMem = process.memoryUsage().heapUsed;
            
            const duration = Number(endTime - startTime) / 1e6;
            const memoryDelta = (endMem - startMem) / 1024 / 1024;

            console.log('OK (' + duration.toFixed(2) + 'ms, ' + memoryDelta.toFixed(2) + 'MB)');
            this.results.tests.push({
                name,
                duration,
                memoryDelta,
                status: 'success'
            });
        } catch (error) {
            console.log('ECHEC');
            console.error(error);
            this.results.tests.push({
                name,
                error: error.message,
                status: 'failure'
            });
        }
    }

    async runAllTests() {
        console.log('Demarrage de la suite de tests complete...\n');
        this.monitor.start();

        try {
            await this.connect();

            // Tests de base
            await this.runTest('Connexion', () => this.connection.execute('SELECT 1'));

            // Tests de charge
            const loadTester = new LoadTester(this.connection);
            for (const concurrency of [10, 100, 1000]) {
                console.log('\nTest de charge ' + concurrency + ' connexions');
                const results = await loadTester.runTest(concurrency);
                this.results.loadTests.push({ concurrency, ...results });
            }

            // Test de memoire
            await this.runTest('Gestion memoire', async () => {
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

        this.results.systemMetrics = this.monitor.getStats();
        this.generateReport();
    }

    generateReport() {
        console.log('\n=== RAPPORT FINAL ===');
        
        // Resume des tests
        const successful = this.results.tests.filter(t => t.status === 'success').length;
        console.log('\nTests: ' + successful + '/' + this.results.tests.length + ' reussis');

        // Performance
        console.log('\nTests de charge:');
        this.results.loadTests.forEach(test => {
            console.log(test.concurrency + ' connexions:');
            console.log('  - ' + test.opsPerSecond + ' ops/sec');
            console.log('  - Latence moyenne: ' + test.latency.avg.toFixed(2) + 'ms');
            console.log('  - Latence P95: ' + test.latency.p95.toFixed(2) + 'ms');
        });

        // Metriques systeme
        const metrics = this.results.systemMetrics;
        console.log('\nMetriques systeme:');
        console.log('Memoire moyenne: ' + metrics.memory.avg.toFixed(2) + 'MB');
        console.log('CPU total: ' + metrics.cpu.total.toFixed(2) + 'ms');
        console.log('Charge systeme moyenne: ' + metrics.system.avgLoad.toFixed(2));

        // Generation rapport JSON
        fs.writeFileSync(
            'rapport-detaille.json',
            JSON.stringify(this.results, null, 2)
        );
        console.log('\nRapport detaille genere: rapport-detaille.json');
    }
}

const suite = new TestSuite();
suite.runAllTests().catch(console.error);
