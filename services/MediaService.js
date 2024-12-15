// Service de gestion des médias
class MediaService {
    constructor() {
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY,
            secretAccessKey: process.env.AWS_SECRET_KEY
        });
        this.bucket = process.env.AWS_BUCKET;
    }

    async uploadFile(file, path) {
        const params = {
            Bucket: this.bucket,
            Key: `${path}/${file.name}`,
            Body: file.data,
            ContentType: file.mimetype
        };

        try {
            const result = await this.s3.upload(params).promise();
            return result.Location;
        } catch (error) {
            console.error('Erreur upload:', error);
            throw error;
        }
    }

    async getSignedUrl(key) {
        const params = {
            Bucket: this.bucket,
            Key: key,
            Expires: 3600
        };

        return this.s3.getSignedUrl('getObject', params);
    }
} 