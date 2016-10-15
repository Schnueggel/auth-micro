import { UserStoreStrategy } from '../services/user-service';
import { KeyStoreStrategy } from '../services/key-store-service';

export function requireKeyStoreStrategy(store: string): KeyStoreStrategy {
    try {
        return require('../services/key-store-strategies/' + store);
    } catch (err) {}

    return require(store);
}

export function requireUserStoreStrategy(store: string): UserStoreStrategy {
    try {
        return require('../services/user-store-strategies/' + store);
    } catch (err) {}

    return require(store);
}
