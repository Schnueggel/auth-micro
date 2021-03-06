import { IKeyStoreStrategy } from '../key-store-service';
import * as redis from 'redis';
import { RedisClient } from 'redis';
import * as EnvUtils from '../../utils/env-utils';
import * as bluebird from 'bluebird';

bluebird.promisifyAll(redis.RedisClient.prototype);

export interface IOptions {
    publicKeyTtl: number;
    host: string;
    port: number;
}

export class RedisStrategy implements IKeyStoreStrategy {
    private client: RedisClient;
    private options: IOptions;

    constructor(options?: IOptions) {
        this.setOptions(options);
        this.client = redis.createClient(this.options);
    }

    public setOptions(options: IOptions): void {
        this.options = Object.assign({
            publicKeyTtl: EnvUtils.getNumber('KS_REDIS_STRATEGY_PUBLIC_KEY_TTL', 60 * 60 * 24 * 30),
            host: EnvUtils.getString('KS_REDIS_STRATEGY_HOST', 'localhost'),
            port: EnvUtils.getNumber('KS_REDIS_STRATEGY_PORT', 6379),
        }, options);
    }

    public get(key: string): Promise<string> {
        return this.client.getAsync(key);
    }

    public set(key: string, value: string, ttl?: number): Promise<string> {
        return this.client.setAsync(key, value)
            .then(() => {
                ttl = typeof ttl === 'number' ? ttl : this.options.publicKeyTtl;
                this.client.expire(key, ttl);
                return key;
            });
    }

    public del(key: string): Promise<boolean> {
        return this.client.delAsync(key).then(count => count === 1);
    }
}
