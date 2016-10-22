/**
 * TODO add logging
 * TODO add facebook, github, google auth
 * TODO add integration tests
 * TODO add Docker
 */
import * as express from 'express';
import { config as env, IConfig } from './config';
import { Request } from '~express/lib/request';
import { UserService } from './services/user-service';
import * as StrategyUtils from './utils/strategy-utils';
import { KeyStoreService } from './services/key-store-service';
import { ParsedAsJson } from 'body-parser';
import { TokenService } from './services/token-service';
import { KeyStoreResult } from './services/key-store-service';
import { Application } from '~express/lib/application';
import { Server } from 'http';
import { Profile } from 'passport-facebook';
import { IHash } from './types';
import { routesFactory } from './routes/index';

export interface IApp extends Application {
    keyStoreResult: KeyStoreResult;
    config: IConfig;
    keyStoreService: KeyStoreService;
    userService: UserService;
    tokenService: TokenService;
    server: Server;
}

export interface IAppRequest extends Request, ParsedAsJson {
    app: IApp;
}

export interface IFacebookProfile extends Profile {
    id: string;
    email: string;
}

export interface IStrategyOptions {
    userStrategyOptions?: IHash;
    keyStoryStrategyOptions?: IHash;
}


export async function stop(app: IApp): Promise<void> {
    if (!app.server) {
        return Promise.resolve();
    }
    return new Promise<void>((resolve: Function) => {
        app.server.close(() => {
            resolve();
        });
    });
}

export async function start(config?: IConfig & IStrategyOptions): Promise<IApp> {
    config = Object.assign({}, env, config);
    const app: IApp = express() as IApp;
    app.config = config;

    const userStrategy = StrategyUtils.requireUserStoreStrategy(config.USER_STORE_STRATEGY, config.userStrategyOptions);
    const keyStoreStrategy = StrategyUtils.requireKeyStoreStrategy(config.KEY_STORE_STRATEGY, config.keyStoryStrategyOptions);
    app.userService = new UserService(userStrategy);
    app.keyStoreService = new KeyStoreService(keyStoreStrategy);
    app.tokenService = new TokenService();

    routesFactory(app, app.tokenService, app.userService, app.keyStoreService);

    app.keyStoreResult = await app.keyStoreService.initRsa();

    return new Promise<IApp>(resolve => {
        app.server = app.listen(config.PORT, function () {
            console.log('Server started at port ' + config.PORT);
            resolve(app);
        });
    });
}

if (!module.parent) {
    start(env);
}
