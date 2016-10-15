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
