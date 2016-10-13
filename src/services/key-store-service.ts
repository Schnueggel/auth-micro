import * as crypto from 'crypto';

export interface KeyStoreStrategy {
    get(_id: string): Promise<string>;
    del(_id: string): Promise<boolean>;
    set(key: string, value:string, ttl?: number): Promise<boolean>;
}

export default class KeyStore {
    private strategy: KeyStoreStrategy;
    constructor (strategy: KeyStoreStrategy) {
        this.strategy = strategy;
    }

    get(key): Promise<string> {
        return this.strategy.get(key);
    }

    store(key): Promise<boolean> {
        return this.hashKey(key).then(hash => this.strategy.set(hash, key));
    }

    hashKey(key): Promise<string> {
        return new Promise(resolve => resolve(crypto.createHash('md5').update(key).digest('hex')));
    }

    del(key): Promise<boolean> {
        return this.strategy.del(key);
    }
}
