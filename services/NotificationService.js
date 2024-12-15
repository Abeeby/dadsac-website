// Service de notifications
class NotificationService {
    constructor() {
        this.webpush = require('web-push');
        this.setupPushNotifications();
    }

    async setupPushNotifications() {
        const vapidKeys = await this.webpush.generateVAPIDKeys();
        this.webpush.setVapidDetails(
            'mailto:contact@dadsac.org',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
    }

    async sendNotification(user, message) {
        try {
            await this.webpush.sendNotification(
                user.subscription,
                JSON.stringify(message)
            );
        } catch (error) {
            console.error('Erreur notification:', error);
        }
    }

    async broadcastNotification(message) {
        const users = await db.getActiveUsers();
        const notifications = users.map(user => 
            this.sendNotification(user, message)
        );
        await Promise.all(notifications);
    }
} 