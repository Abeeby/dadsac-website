// Service de cache
class CacheService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT
        });
    }

    async get(key) {
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
    }

    async set(key, value, expiration = 3600) {
        await this.redis.set(
            key,
            JSON.stringify(value),
            'EX',
            expiration
        );
    }

    async invalidate(pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(keys);
        }
    }
} 