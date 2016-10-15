
interface Env {
    PORT: string;
    KEY_STORE_STRATEGY: string;
    USER_STORE_STRATEGY: string;
    [key: string]: string;
    PATH: string;
}

export default {
    PORT: Number(getEnv().PORT) || 9999,
    KEY_STORE_STRATEGY: getEnv().KEY_STORE_STRATEGY || 'redis',
    USER_STORE_STRATEGY: getEnv().USER_STORE_STRATEGY || 'mongo-strategy'
};

export function getEnv(): Env {
    return process.env as Env;
}
