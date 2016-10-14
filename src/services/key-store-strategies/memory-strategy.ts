import { KeyStoreStrategy } from '../key-store-service';
import config from '../../config';

export default class MemoryStrategy implements KeyStoreStrategy {
    private store: {[index: string]: string} = {};
    private timeouts: {[index: string]: number} = {};

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
                ttl = ttl || config.PUBLIC_KEY_TTL || 3600;
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
