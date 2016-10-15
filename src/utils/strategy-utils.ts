import { UserStoreStrategy } from '../services/user-service';
import { KeyStoreStrategy } from '../services/key-store-service';

export function requireKeyStoreStrategy(store: string): KeyStoreStrategy {
    let strategy: any;
    try {
        strategy = require('../services/key-store-strategies/' + store).default;
    } catch (err) {
        strategy =  require(store);
    }

    return new strategy();
}

export function requireUserStoreStrategy(store: string): UserStoreStrategy {
    let strategy: any;
    try {
        strategy = require('../services/user-store-strategies/' + store).default;
    } catch (err) {
        strategy =  require(store);
    }

    return new strategy();
}
