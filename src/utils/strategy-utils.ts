import { IKeyStoreStrategy } from '../services/key-store-service';
import { IUserStoreStrategy } from '../services/user-service';

export function requireKeyStoreStrategy(store: string): IKeyStoreStrategy {
    let strategy: typeof IKeyStoreStrategy;
    try {
        strategy = require('../services/key-store-strategies/' + store).default;
    } catch (err) {
        strategy =  require(store);
    }

    return new strategy();
}

export function requireUserStoreStrategy(store: string): IUserStoreStrategy {
    let strategy: typeof IUserStoreStrategy;
    try {
        strategy = require('../services/user-store-strategies/' + store).default;
    } catch (err) {
        strategy =  require(store);
    }

    return new strategy();
}
