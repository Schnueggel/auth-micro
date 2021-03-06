export function getRegExp(key: string, defaultValue?: RegExp): RegExp {
    if (key && typeof process.env[key] === 'string') {
        return new RegExp(key);
    }

    return defaultValue;
}

export function getNumber(key: string, defaultValue?: number): number {
    if (process.env[key]) {
        return Number(key);
    }

    return defaultValue;
}

export function getString(key: string, defaultValue?: string): string {
    if (typeof process.env[key] === 'string') {
        return process.env[key];
    }
    return defaultValue;
}

export function getBoolean(key: string, defaultValue?: boolean): boolean {
    if (process.env[key]) {
        if (process.env[key] === '0' || process.env[key] === 'false') {
            return false;
        }

        if (process.env[key] === 'true' || process.env[key] === '1') {
            return true;
        }

        console.warn(`Environment ${key} should be boolean type but found ${process.env[key]}`);
    }
    return defaultValue;
}

export function getArray(key: string, defaultValue?: Array<string>): Array<string> {
    if (typeof key === 'string') {
        return key.split(',');
    }
    return defaultValue;
}

/**
 * Imports env vars from a file. This file should have an export named config that represents a hashmap
 * If the file does not exist there will be a warning on the console
 * @param file
 */
export function importEnvFromFile(file: string): void {
    try {
        const env = require(file);
        Object.assign(process.env, env.config);
    } catch (err) {
        console.warn('Unable to import env from file: ' + file);
    }
}
