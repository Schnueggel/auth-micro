import { KeyStoreStrategy } from '../key-store-service';

export interface IOptions {
    publicKeyTtl: number;
}

/**
 * Strategy for saving keys in memory.
 */
export default class MemoryStrategy implements KeyStoreStrategy {
    private store: {[index: string]: string} = {};
    private timeouts: {[index: string]: number} = {};
    private options: IOptions;

    constructor(options?: IOptions) {
        this.setOptions(options);
    }

    setOptions(options: IOptions) {
        this.options = Object.assign({
            publicKeyTtl: 3600
        }, options);
    }

    get(key: string): Promise<string> {
        return new Promise(
            (resolve) => {
                resolve(this.store[key] || null);
            }
        );
    }

    set(key: string, value: string, ttl: number): Promise<string> {
        return new Promise(
            (resolve) => {
                ttl = typeof ttl === 'number' ? ttl : this.options.publicKeyTtl;
                if (this.store[key]) {
                    clearTimeout(this.timeouts[key]);
                }
                this.store[key] = value;
                this.timeouts[key] = setTimeout(
                    () => {
                        delete this.store[key];
                        delete this.timeouts[key];
                    }
                );

                resolve(key);
            }
        );
    }

    del(key: string): Promise<boolean> {
        delete this.store[key];
        clearTimeout(this.timeouts[key]);
        delete this.timeouts[key];
        return Promise.resolve(true);
    }
}
