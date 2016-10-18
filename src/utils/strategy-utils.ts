import { camelCase, upperFirst } from 'lodash';
import { IKeyStoreStrategy } from '../services/key-store-service';
import { IUserStoreStrategy } from '../services/user-service';

export function requireKeyStoreStrategy(store: string): IKeyStoreStrategy {
    let strategy: {new(): IKeyStoreStrategy};
    try {
        strategy = require('../services/key-store-strategies/' + store)[upperFirst(camelCase(store))];
    } catch (err) {
        strategy = require(store);
    }

    return new strategy();
}

export function requireUserStoreStrategy(store: string): IUserStoreStrategy {
    let strategy: {new(): IUserStoreStrategy};
    try {
        strategy = require('../services/user-store-strategies/' + store)[upperFirst(camelCase(store))];
    } catch (err) {
        strategy = require(store);
    }

    return new strategy();
}
