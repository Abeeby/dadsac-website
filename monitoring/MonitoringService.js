// Service de monitoring
class MonitoringService {
    constructor() {
        this.prometheus = require('prom-client');
        this.grafana = require('grafana-api');
        this.sentry = require('@sentry/node');
    }

    setupMonitoring() {
        // Métriques Prometheus
        const collectDefaultMetrics = this.prometheus.collectDefaultMetrics;
        collectDefaultMetrics({ timeout: 5000 });

        // Métriques personnalisées
        this.donationCounter = new this.prometheus.Counter({
            name: 'dadsac_donations_total',
            help: 'Total des dons reçus'
        });

        this.responseTime = new this.prometheus.Histogram({
            name: 'dadsac_http_response_time',
            help: 'Temps de réponse HTTP'
        });

        // Configuration Sentry pour le suivi des erreurs
        this.sentry.init({
            dsn: process.env.SENTRY_DSN,
            environment: process.env.NODE_ENV
        });
    }

    async setupAlerts() {
        // Configuration des alertes Grafana
        const alertRules = {
            name: 'High Error Rate',
            conditions: [{
                evaluator: {
                    params: [5],
                    type: 'gt'
                },
                query: {
                    params: ['A', '5m', 'now']
                },
                reducer: {
                    params: [],
                    type: 'avg'
                },
                type: 'query'
            }],
            frequency: '1m',
            handler: 1,
            notifications: [{
                uid: 'slack-notification'
            }]
        };

        await this.grafana.createAlert(alertRules);
    }

    async trackMetric(metric, value, tags = {}) {
        try {
            await this.prometheus.gauge({
                name: metric,
                help: `Metric for ${metric}`,
                labelNames: Object.keys(tags)
            }).set(value);
        } catch (error) {
            console.error(`Error tracking metric ${metric}:`, error);
        }
    }
} 