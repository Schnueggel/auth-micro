const redis = require('redis');
const config = require('config');
const client = redis.createClient({
    host: config.REDIS_HOST,
    port: config.REDIS_PORT
});

class RedisStrategy {
    constructor(options) {
        this.client = redis.createClient(options || {
            host: config.REDIS_HOST,
            port: config.REDIS_PORT
        });
    }

    /**
     *
     * @param {string} key
     * @return {Promise.<string>}
     */
    get(key) {
        return this.client.getAsync(key);
    }

    /**
     *
     * @param {string} key
     * @param {string} value
     * @param {number} [ttl] time to life
     * @return {Promise.<boolean>}
     */
    set(key, value, ttl) {
        return this.client.setAsync(key, value).then(result => {
            this.client.expire(key, ttl || config.PUBLIC_KEY_TTL || 3600);
            return result === 'OK';
        });
    }

    /**
     *
     * @param {string} key
     * @return {Promise.<boolean>}
     */
    del(key) {
        return this.client.delAsync(key).then(count => count === 1);
    }
}

exports.RedisStrategy = RedisStrategy;
