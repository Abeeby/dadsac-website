require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const testSuite = {
    // Tests d'environnement et dépendances
    testEnvironment() {
        console.log('📋 Test de l\'environnement...');
        const requiredEnvVars = ['NODE_ENV', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
        for (const envVar of requiredEnvVars) {
            if (process.env[envVar] !== undefined) {
                console.log(`  ✓ ${envVar} est défini`);
            } else {
                throw new Error(`${envVar} n'est pas défini`);
            }
        }
        return Promise.resolve();
    },

    testDependencies() {
        console.log('\n📦 Test des dépendances...');
        const dependencies = ['express', 'mysql2', 'jsonwebtoken', 'dotenv'];
        for (const dep of dependencies) {
            try {
                require(dep);
                console.log(`  ✓ ${dep} est correctement installé`);
            } catch (error) {
                throw new Error(`Dépendance manquante: ${dep}`);
            }
        }
        return Promise.resolve();
    },

    // Test du serveur Express
    async testExpressServer() {
        console.log('\n🌐 Test du serveur Express...');
        const app = express();
        const server = app.listen(3000, () => {
            console.log('  ✓ Serveur démarré sur le port 3000');
        });
        server.close();
        console.log('  ✓ Serveur arrêté proprement');
    },

    // Test de connexion base de données
    async testDatabase() {
        console.log('\n🗄️ Test de la base de données...');
        try {
            const dbConfig = {
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'dadsac_test'
            };

            console.log('Tentative de connexion avec:', {
                host: dbConfig.host,
                user: dbConfig.user,
                database: dbConfig.database
            });

            const connection = await mysql.createConnection(dbConfig);
            console.log('✓ Connexion créée');

            await connection.connect();
            console.log('✓ Connexion établie');

            const [rows] = await connection.execute('SELECT 1 as test');
            console.log('✓ Requête test réussie');

            await connection.end();
            console.log('✓ Connexion fermée');

        } catch (error) {
            console.error('\nErreur détaillée:', error);
            throw new Error(`Erreur base de données: ${error.message}`);
        }
    },

    // Initialisation de la base de données
    async initDatabase() {
        console.log('\n📦 Initialisation de la base de données...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });

        try {
            // Création de la table users
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✓ Table users créée');

            // Création de la table donations
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS donations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    amount DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(3) DEFAULT 'EUR',
                    status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `);
            console.log('✓ Table donations créée');

            // Insertion données de test
            await connection.execute(`
                INSERT INTO users (email, password_hash) 
                VALUES ('test@dadsac.org', 'test_hash')
                ON DUPLICATE KEY UPDATE email=email
            `);
            console.log('✓ Données de test insérées');

        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        } finally {
            await connection.end();
        }
    },

    // Test des opérations utilisateur
    async testUserOperations() {
        console.log('\n👤 Test des opérations utilisateur...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });

        try {
            // Test création utilisateur
            const [result] = await connection.execute(
                'INSERT INTO users (email, password_hash) VALUES (?, ?)',
                ['new_user@dadsac.org', 'hashed_password']
            );
            console.log('✓ Création utilisateur réussie');

            // Test lecture utilisateur
            const [users] = await connection.execute(
                'SELECT * FROM users WHERE email = ?',
                ['new_user@dadsac.org']
            );
            if (users.length > 0) {
                console.log('✓ Lecture utilisateur réussie');
            }

        } finally {
            await connection.end();
        }
    },

    // Test des opérations de don
    async testDonationOperations() {
        console.log('\n💰 Test des opérations de don...');
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });

        try {
            // Création d'un don
            const [result] = await connection.execute(
                'INSERT INTO donations (user_id, amount) VALUES (?, ?)',
                [1, 100.00]
            );
            console.log('✓ Création don réussie');

            // Lecture des dons
            const [donations] = await connection.execute(
                'SELECT * FROM donations WHERE user_id = ?',
                [1]
            );
            if (donations.length > 0) {
                console.log('✓ Lecture don réussie');
            }

        } finally {
            await connection.end();
        }
    },

    // Test JWT
    async testJWT() {
        console.log('\n🔐 Test JWT...');
        const testPayload = { id: 1, email: 'test@example.com' };
        const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
        console.log('  ✓ Token JWT généré');

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
        if (decoded.id === testPayload.id && decoded.email === testPayload.email) {