import * as crypto from 'crypto';
import NodeRsa = require('node-rsa');

export interface KeyStoreStrategy {
    get(_id: string): Promise<string>;
    del(_id: string): Promise<boolean>;
    set(key: string, value: string, ttl?: number): Promise<string>;
}

export default class KeyStoreService {
    private strategy: KeyStoreStrategy;
    public rsa: NodeRsa;

    constructor(strategy: KeyStoreStrategy) {
        this.strategy = strategy;
    }

    get(key): Promise<string> {
        return this.strategy.get(key);
    }

    store(key): Promise<string> {
        return this.hashKey(key).then(hash => this.strategy.set(hash, key));
    }

    hashKey(key): Promise<string> {
        return new Promise(resolve => resolve(crypto.createHash('md5').update(key).digest('hex')));
    }

    del(key): Promise<boolean> {
        return this.strategy.del(key);
    }

    /**
     * Get the current rsa key or creates on if it does not exist
     * @return {Promise<NodeRsa>}
     */
    async getRsa(): Promise<NodeRsa> {
        if (this.rsa) {
            return Promise.resolve(this.rsa);
        }
        return this.initRsa();
    }

    /**
     * This should only be called once during app start
     * @return {Promise<NodeRsa>}
     */
    async initRsa(): Promise<NodeRsa> {
        this.rsa = new NodeRsa({b: 2048});
        await this.store(this.rsa.exportKey('public'));
        return Promise.resolve(this.rsa);
    }
}
