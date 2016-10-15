import * as crypto from 'crypto';
import NodeRsa = require('node-rsa');

export interface KeyStoreStrategy {
    get(_id: string): Promise<string>;
    del(_id: string): Promise<boolean>;
    set(key: string, value: string, ttl?: number): Promise<string>;
}

export interface KeyStoreResult {
    publicKey: string;
    privateKey: string;
    uid: string;
}

export default class KeyStoreService {
    private strategy: KeyStoreStrategy;
    private keyStoreResult:KeyStoreResult;

    constructor(strategy: KeyStoreStrategy) {
        this.strategy = strategy;
    }

    get(key): Promise<string> {
        return this.strategy.get(key);
    }

    /**
     * Stores the given (public) key and returns the generated uid
     * @param key (public) key to store
     * @return {Promise<string>}
     */
    store(key): Promise<string> {
        return this.hashKey(key).then(uid => {
            this.strategy.set(uid, key);
            return uid;
        });
    }

    hashKey(key): Promise<string> {
        return new Promise(resolve => resolve(crypto.createHash('md5').update(key).digest('hex')));
    }

    del(key): Promise<boolean> {
        return this.strategy.del(key);
    }

    /**
     * Get the current rsa keys or creates them if they do not exist
     * @return {Promise<KeyStoreResult>}
     */
    async getRsa(): Promise<KeyStoreResult> {
        if (this.keyStoreResult) {
            return Promise.resolve(this.keyStoreResult);
        }
        return this.initRsa();
    }

    /**
     * This should only be called once during app start
     * @return {Promise<KeyStoreResult>}
     */
    async initRsa(): Promise<KeyStoreResult> {
        const rsa = new NodeRsa({b: 2048});
        const publicKey = rsa.exportKey('public');
        const uid = await this.store(publicKey);
        this.keyStoreResult = {
            uid,
            publicKey,
            privateKey: rsa.exportKey()
        };
        return Promise.resolve(this.keyStoreResult);
    }
}
