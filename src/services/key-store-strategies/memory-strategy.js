const config = require('config');

class MemoryStrategy {
    constructor() {
        this.store = {};
        this.timeouts = {};
    }

    /**
     * Resolve with null if key does not exist
     * @param {string} key
     * @return {Promise.<string>}
     */
    get(key) {
        return new Promise((resolve) => {
            resolve(this.store[key] || null);
        });
    }

    /**
     *
     * @param {string} key
     * @param {string} value
     * @param {number} [ttl] time to life
     * @return {Promise.<boolean>}
     */
    set(key, value, ttl) {
        return new Promise((resolve) => {
            ttl = ttl || config.PUBLIC_KEY_TTL || 3600;
            if (this.store[key]) {
                clearTimeout(this.timeouts[key]);
            }
            this.store[key] = value;
            this.timeouts[key] = setTimeout(() => {
                delete this.store[key];
                delete this.timeouts[key];
            });

            resolve(true);
        });
    }

    /**
     *
     * @param {string} key
     * @return {Promise.<boolean>}
     */
    del(key) {
        delete this.store[key];
        clearTimeout(this.timeouts[key]);
        delete this.timeouts[key];
    }
}

exports.RedisStrategy = MemoryStrategy;
