// Tests automatisés
class TestSuite {
    constructor() {
        this.jest = require('jest');
        this.supertest = require('supertest');
    }

    async runTests() {
        // Tests unitaires
        await this.runUnitTests();
        // Tests d'intégration
        await this.runIntegrationTests();
        // Tests E2E
        await this.runE2ETests();
    }

    async runUnitTests() {
        describe('Services Tests', () => {
            test('DonationService', async () => {
                const donation = await donationService.create({
                    amount: 100,
                    currency: 'EUR'
                });
                expect(donation).toBeDefined();
                expect(donation.amount).toBe(100);
            });

            test('AuthService', async () => {
                const token = await authService.generateToken({
                    id: 1,
                    email: 'test@dadsac.org'
                });
                expect(token).toBeDefined();
            });
        });
    }

    async runE2ETests() {
        describe('E2E Tests', () => {
            test('Donation Flow', async () => {
                const browser = await puppeteer.launch();
                const page = await browser.newPage();
                
                await page.goto('https://dadsac.org/don');
                await page.type('#amount', '50');
                await page.click('#submit');
                
                const success = await page.waitForSelector('.success-message');
                expect(success).toBeTruthy();
                
                await browser.close();
            });
        });
    }
} 