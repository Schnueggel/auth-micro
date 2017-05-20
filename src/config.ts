
import { getString, getNumber } from './utils/env-utils';

export interface IConfig {
    PORT?: number;
    KEY_STORE_STRATEGY?: string;
    GET_USER_URL: string;
    FIND_USER_URL: string;
    [key: string]: any;
}

export const config: IConfig = {
    PORT: getNumber('PORT', 9999),
    KEY_STORE_STRATEGY: getString('KEY_STORE_STRATEGY', 'redis-strategy'),
    USER_STORE_STRATEGY: getString('USER_STORE_STRATEGY', 'mongo-strategy'),
    GET_USER_URL: getString('GET_USER_URL', 'http://localhost:9000/users/:id'),
    FIND_USER_URL: getString('FIND_USER_URL', 'http://localhost:9000/users'),
};
