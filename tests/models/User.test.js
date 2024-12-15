require('dotenv').config();
const mysql = require('mysql2/promise');

class UserTest {
    constructor() {
        this.connection = null;
    }

    async connect() {
        console.log('🔌 Tentative de connexion à la base de données...');
        this.connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });
        console.log('✅ Connexion établie avec succès');
    }

    async testUserCRUD() {
        console.log('\n🧪 Démarrage des tests CRUD utilisateur...');
        try {
            // Create
            console.log('\n📝 Test CREATE...');
            const [createResult] = await this.connection.execute(
                'INSERT INTO users (email, password_hash) VALUES (?, ?)',
                ['user.test@dadsac.org', 'test_password_hash']
            );
            console.log('✅ CREATE: Utilisateur créé avec ID:', createResult.insertId);

            // Read
            console.log('\n📖 Test READ...');
            const [user] = await this.connection.execute(
                'SELECT * FROM users WHERE id = ?',
                [createResult.insertId]
            );
            console.log('✅ READ: Utilisateur trouvé:', user[0].email);

            // Update
            console.log('\n📝 Test UPDATE...');
            await this.connection.execute(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                ['new_password_hash', createResult.insertId]
            );
            console.log('✅ UPDATE: Mot de passe utilisateur mis à jour');

            // Delete
            console.log('\n🗑️ Test DELETE...');
            await this.connection.execute(
                'DELETE FROM users WHERE id = ?',
                [createResult.insertId]
            );
            console.log('✅ DELETE: Utilisateur supprimé');

            return true;
        } catch (error) {
            console.error('❌ ERREUR pendant les tests:', error);
            return false;
        }
    }

    async close() {
        if (this.connection) {
            await this.connection.end();
            console.log('\n🔌 Connexion à la base de données fermée');
        }
    }
}

// Exécution des tests
async function runUserTests() {
    console.log('🚀 Démarrage de la suite de tests User...\n');
    const userTest = new UserTest();
    try {
        await userTest.connect();
        const success = await userTest.testUserCRUD();
        
        if (success) {
            console.log('\n✅ SUCCÈS: Tous les tests User ont réussi! ✅\n');
        } else {
            console.log('\n❌ ÉCHEC: Certains tests ont échoué ❌\n');
        }
    } catch (error) {
        console.error('\n💥 ERREUR FATALE:', error);
    } finally {
        await userTest.close();
    }
}

// Lancement immédiat des tests
console.log('='.repeat(50));
console.log('🧪 SUITE DE TESTS: User Model 🧪');
console.log('='.repeat(50));

runUserTests().catch(error => {
    console.error('💥 ERREUR NON GÉRÉE:', error);
    process.exit(1);
});
