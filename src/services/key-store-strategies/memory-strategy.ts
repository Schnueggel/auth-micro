import { IKeyStoreStrategy } from '../key-store-service';
import * as EnvUtils from '../../utils/env-utils';

export interface IOptions {
    publicKeyTtl: number;
}

/**
 * Strategy for saving keys in memory.
 */
export class MemoryStrategy implements IKeyStoreStrategy {
    private store: {[index: string]: string} = {};
    private timeouts: {[index: string]: NodeJS.Timer} = {};
    private options: IOptions;

    constructor(options?: IOptions) {
        this.setOptions(options);
    }

    public setOptions(options: IOptions): void {
        this.options = Object.assign({
            publicKeyTtl: EnvUtils.getNumber('KS_MEMORY_STRATEGY_PUBLIC_KEY_TTL', 3600)
        }, options);
    }

    public get(key: string): Promise<string> {
        return new Promise(
            (resolve) => {
                resolve(this.store[key] || null);
            }
        );
    }

    public set(key: string, value: string, ttl: number): Promise<string> {
        return new Promise(resolve => {
            ttl = typeof ttl === 'number' ? ttl : this.options.publicKeyTtl;
            if (this.store[key]) {
                clearTimeout(this.timeouts[key]);
            }
            this.store[key] = value;
            this.timeouts[key] = setTimeout(() => {
                delete this.store[key];
                delete this.timeouts[key];
            }, ttl);

            resolve(key);
        });
    }

    public del(key: string): Promise<boolean> {
        delete this.store[key];
        clearTimeout(this.timeouts[key]);
        delete this.timeouts[key];
        return Promise.resolve(true);
    }
}
