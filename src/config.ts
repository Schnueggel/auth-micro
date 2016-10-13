
interface Env {
    PORT: string;
    MONGO_URL: string;
    MONGO_URL_TEST: string;
    REDIS_HOST: string;
    REDIS_PORT: string;
    KEY_STORE_STRATEGY: string;
    ENABLE_USERNAME: string;
    PASSWORD_LENGTH: string;
    [key: string]: string;
    PATH: string;
}

export default {
    PORT: getEnv().PORT || 9999,
    MONGO_URL: getEnv().MONGO_URL || 'localhost:27017/auth-micro',
    MONGO_URL_TEST: getEnv().MONGO_URL_TEST || 'localhost:27017/auth-micro-test',
    REDIS_HOST: getEnv().REDIS_HOST || 'localhost',
    REDIS_PORT: getEnv().REDIS_PORT || '6379',
    KEY_STORE_STRATEGY: getEnv().KEY_STORE_STRATEGY || 'redis',
    PUBLIC_KEY_TTL: 60 * 60 * 24 * 40,
    ENABLE_USERNAME: falsyEnv(getEnv().ENABLE_USERNAME),
    PASSWORD_LENGTH: getEnv().PASSWORD_LENGTH || 8,
    PASSWORD_REGEX: '.+'
};

function falsyEnv(value: string): string {
    return (value !== '0' && value !== 'false' && value);
}

export function getEnv(): Env {
    return process.env as any;
}
