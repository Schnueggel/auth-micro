import * as crypto from 'crypto';
import NodeRsa = require('node-rsa');

export interface IKeyStoreStrategy {
    get(_id: string): Promise<string>;
    del(_id: string): Promise<boolean>;
    set(key: string, value: string, ttl?: number): Promise<string>;
}

export interface KeyStoreResult {
    publicKey: string;
    privateKey: string;
    uid: string;
}

export class KeyStoreService {
    private strategy: IKeyStoreStrategy;
    private keyStoreResult: KeyStoreResult;

    constructor(strategy: IKeyStoreStrategy) {
        this.strategy = strategy;
    }

    public get(key: string): Promise<string> {
        return this.strategy.get(key);
    }

    /**
     * Stores the given (public) key and returns the generated uid
     * @param key (public) key to store
     * @return {Promise<string>}
     */
    public store(key: string): Promise<string> {
        return this.hashKey(key).then(uid => {
            this.strategy.set(uid, key);
            return uid;
        });
    }

    public del(key: string): Promise<boolean> {
        return this.strategy.del(key);
    }

    /**
     * Get the current rsa keys or creates them if they do not exist
     * @return {Promise<KeyStoreResult>}
     */
    public async getRsa(): Promise<KeyStoreResult> {
        if (this.keyStoreResult) {
            return Promise.resolve(this.keyStoreResult);
        }
        return this.initRsa();
    }

    /**
     * This should only be called once during app start
     * @return {Promise<KeyStoreResult>}
     */
    public async initRsa(): Promise<KeyStoreResult> {
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

    private hashKey(key: string): Promise<string> {
        return new Promise(resolve => resolve(crypto.createHash('md5').update(key).digest('hex')));
    }

}
