import { KeyStoreStrategy } from '../key-store-service';
import * as redis from 'redis';
import { RedisClient } from 'redis';

export interface IOptions {
    publicKeyTtl: number;
    host: string;
    port: number;
}

export default class RedisStrategy implements KeyStoreStrategy {
    private client: RedisClient;
    private options: IOptions;

    constructor(options?: IOptions) {
        this.setOptions(options);
        this.client = redis.createClient(this.options);
    }

    setOptions(options: IOptions) {
        this.options = Object.assign({
            publicKeyTtl: 3600,
            host: 'localhost',
            port: 6379
        }, options);
    }

    get(key: string): Promise<string> {
        return this.client.getAsync(key);
    }

    set(key: string, value: string, ttl?: number): Promise<string> {
        return this.client.setAsync(key, value)
            .then(() => {
                ttl = typeof ttl === 'number' ? ttl : this.options.publicKeyTtl;
                this.client.expire(key, ttl);
                return key;
            });
    }

    del(key: string): Promise<boolean> {
        return this.client.delAsync(key).then(count => count === 1);
    }
}
