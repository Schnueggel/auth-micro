
import { getBoolean, getString, getNumber, getArray } from './utils/env-utils';

export interface IConfig {
    PORT: number;
    KEY_STORE_STRATEGY: string;
    AUTH_FACEBOOK: boolean;
    USER_STORE_STRATEGY: string;
    FACEBOOK_APP_ID: string;
    FACEBOOK_APP_SECRET: string;
    FACEBOOK_CALLBACK_URL: string;
    FACEBOOK_PROFILE_FIELDS: Array<string>;
    TRUE_DELETE_ENABLED: boolean;
    [key: string]: any;
}

export const config: IConfig = {
    PORT: getNumber('PORT', 9999),
    KEY_STORE_STRATEGY: getString('KEY_STORE_STRATEGY', 'redis-strategy'),
    USER_STORE_STRATEGY: getString('USER_STORE_STRATEGY', 'mongo-strategy'),
    FACEBOOK_APP_SECRET: getString('FACEBOOK_APP_SECRET', ''),
    FACEBOOK_APP_ID: getString('FACEBOOK_APP_ID', ''),
    FACEBOOK_CALLBACK_URL: getString('FACEBOOK_CALLBACK_URL', 'http://localhost:9999'),
    FACEBOOK_PROFILE_FIELDS: getArray('FACEBOOK_PROFILE_FIELDS', []),
    TRUE_DELETE_ENABLED: getBoolean('TRUE_DELETE_ENABLED', false),
    AUTH_FACEBOOK: getBoolean('AUTH_FACEBOOK', false)
};
