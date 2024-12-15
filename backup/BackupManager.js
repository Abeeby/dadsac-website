// Gestionnaire de sauvegardes
class BackupManager {
    constructor() {
        this.s3 = new AWS.S3();
        this.mysql = require('mysql2/promise');
    }

    async performBackup() {
        const timestamp = new Date().toISOString();
        const backupPath = `backups/${timestamp}`;

        try {
            // Sauvegarde de la base de données
            const dbBackup = await this.backupDatabase();
            await this.uploadToS3(dbBackup, `${backupPath}/database.sql`);

            // Sauvegarde des fichiers
            const filesBackup = await this.backupFiles();
            await this.uploadToS3(filesBackup, `${backupPath}/files.zip`);

            // Rotation des sauvegardes
            await this.rotateBackups();

            await this.notifyBackupSuccess(timestamp);
        } catch (error) {
            await this.notifyBackupFailure(error);
            throw error;
        }
    }

    async backupDatabase() {
        const connection = await this.mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await connection.query('SHOW TABLES');
        const tables = rows.map(row => Object.values(row)[0]);

        let dump = '';
        for (const table of tables) {
            const [tableData] = await connection.query(`SELECT * FROM ${table}`);
            dump += `-- Table: ${table}\n`;
            dump += `INSERT INTO ${table} VALUES\n`;
            dump += this.formatInsertStatements(tableData);
        }

        await connection.end();
        return dump;
    }

    async rotateBackups() {
        const MAX_BACKUPS = 30;
        const backups = await this.s3.listObjects({
            Bucket: process.env.BACKUP_BUCKET,
            Prefix: 'backups/'
        }).promise();

        if (backups.Contents.length > MAX_BACKUPS) {
            const oldestBackups = backups.Contents
                .sort((a, b) => a.LastModified - b.LastModified)
                .slice(0, backups.Contents.length - MAX_BACKUPS);

            for (const backup of oldestBackups) {
                await this.s3.deleteObject({
                    Bucket: process.env.BACKUP_BUCKET,
                    Key: backup.Key
                }).promise();
            }
        }
    }
} 