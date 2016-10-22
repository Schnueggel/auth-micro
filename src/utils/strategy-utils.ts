import { camelCase, upperFirst } from 'lodash';
import { IKeyStoreStrategy } from '../services/key-store-service';
import { IUserStoreStrategy } from '../services/user-service';
import { IHash } from '../types';

export function requireKeyStoreStrategy(store: string, options?: IHash): IKeyStoreStrategy {
    let strategy: {new(options?: IHash): IKeyStoreStrategy};
    try {
        strategy = require('../services/key-store-strategies/' + store)[upperFirst(camelCase(store))];
    } catch (err) {
        strategy = require(store);
    }

    return new strategy(options);
}

export function requireUserStoreStrategy(store: string, options?: IHash): IUserStoreStrategy {
    let strategy: {new(options?: IHash): IUserStoreStrategy};
    try {
        strategy = require('../services/user-store-strategies/' + store)[upperFirst(camelCase(store))];
    } catch (err) {
        strategy = require(store);
    }

    return new strategy(options);
}
