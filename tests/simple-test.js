console.log('Début du test');

// Importer les dépendances
try {
    require('dotenv').config();
    const mysql = require('mysql2/promise');
    console.log('✓ Modules chargés avec succès');
} catch (error) {
    console.error('❌ Erreur de chargement des modules:', error);
    process.exit(1);
}

// Fonction de test simple
async function simpleTest() {
    console.log('\nTentative de connexion à la base de données...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'dadsac_test'
        });
        
        console.log('✓ Connexion établie');
        
        const [rows] = await connection.execute('SELECT 1');
        console.log('✓ Requête test réussie');
        
        await connection.end();
        console.log('✓ Connexion fermée');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

// Exécution du test
console.log('🚀 Démarrage du test simple...');
simpleTest();
