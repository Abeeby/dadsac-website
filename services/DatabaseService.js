// Service de gestion de la base de données
class DatabaseService {
    constructor() {
        this.pool = mysql.createPool({
            ...dbConfig[process.env.NODE_ENV],
            waitForConnections: true,
            connectionLimit: 10
        });
    }

    async query(sql, params) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Erreur DB:', error);
            throw error;
        }
    }

    async getDonations() {
        return this.query('SELECT * FROM donations ORDER BY created_at DESC');
    }

    async createDonation(donationData) {
        const sql = 'INSERT INTO donations SET ?';
        return this.query(sql, [donationData]);
    }
} 