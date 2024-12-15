// Sécurité et authentification avancée
class SecurityManager {
    constructor() {
        this.helmet = require('helmet');
        this.rateLimit = require('express-rate-limit');
        this.jwt = require('jsonwebtoken');
    }

    setupSecurity(app) {
        // Protection headers HTTP
        app.use(this.helmet());

        // Rate limiting
        app.use(this.rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100 // limite par IP
        }));

        // Protection CSRF
        app.use(this.csrf());

        // Validation des entrées
        app.use(this.inputValidation());
    }

    async authenticate(req, res, next) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) throw new Error('Token manquant');

            const decoded = await this.jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Non autorisé' });
        }
    }

    async generateToken(user) {
        return this.jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    setupTwoFactorAuth() {
        const speakeasy = require('speakeasy');
        const QRCode = require('qrcode');

        return {
            generateSecret: async (user) => {
                const secret = speakeasy.generateSecret({
                    name: `DADSAC (${user.email})`
                });
                const qrCode = await QRCode.toDataURL(secret.otpauth_url);
                return { secret: secret.base32, qrCode };
            },
            verifyToken: (secret, token) => {
                return speakeasy.totp.verify({
                    secret,
                    encoding: 'base32',
                    token
                });
            }
        };
    }
} 