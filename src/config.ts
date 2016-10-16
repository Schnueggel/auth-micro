
import { getBoolean, getString, getNumber } from './utils/env-utils';

interface Env {
    PORT: string;
    KEY_STORE_STRATEGY: string;
    USER_STORE_STRATEGY: string;
    ENABLE_TRUE_DELETE: string;
    [key: string]: string;
    PATH: string;
}

export default {
    PORT: getNumber('PORT', 9999),
    KEY_STORE_STRATEGY: getString('KEY_STORE_STRATEGY', 'redis-strategy'),
    USER_STORE_STRATEGY: getString('USER_STORE_STRATEGY', 'mongo-strategy'),
    TRUE_DELETE_ENABLED: getBoolean('ENABLE_TRUE_DELETE', false)
};
