const crypto = require('crypto');

class KeyStore {
    constructor (strategy) {
        this.strategy = strategy;
    }

    get(key) {
        return this.strategy.get(key);
    }

    store(key) {
        return this.hashKey(key).then(hash => this.strategy.set(hash, key));
    }

    hashKey(key) {
        return new Promise(resolve => resolve(crypto.createHash('md5').update(key).digest('hex')));
    }

    del(key) {
        return this.strategy.del(key);
    }
}


module.exports = KeyStore;
