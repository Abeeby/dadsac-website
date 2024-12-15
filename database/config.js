// Configuration de la base de données
const dbConfig = {
    development: {
        host: 'localhost',
        database: 'dadsac_dev',
        user: 'root',
        password: 'password'
    },
    production: {
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    }
};

module.exports = dbConfig; 