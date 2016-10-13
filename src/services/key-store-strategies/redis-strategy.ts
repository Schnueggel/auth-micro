import { KeyStoreStrategy } from '../key-store-service';
import * as redis from 'redis';
import config from '../../config';
import { RedisClient } from 'redis';
import { ClientOptions } from 'redis';

export default class RedisStrategy implements KeyStoreStrategy {
    private client: RedisClient;

    constructor(options: ClientOptions) {
        this.client = redis.createClient(
            options || {
                host: config.REDIS_HOST,
                port: Number(config.REDIS_PORT)
            }
        );
    }

    get(key: string): Promise<string> {
        return this.client.getAsync(key);
    }

    set(key: string, value: string, ttl?: number): Promise<boolean> {
        return this.client.setAsync(key, value).then(
            result => {
                this.client.expire(key, ttl || config.PUBLIC_KEY_TTL || 3600);
                return result === 'OK';
            }
        );
    }

    del(key: string): Promise<boolean> {
        return this.client.delAsync(key).then(count => count === 1);
    }
}
