/**
 * TODO add logging
 * TODO add integration tests
 * TODO add Docker
 */
import * as express from 'express';
import { config as env, IConfig } from './config';
import { Request } from '~express/lib/request';
import * as StrategyUtils from './utils/strategy-utils';
import { KeyStoreService } from './services/key-store-service';
import { ParsedAsJson } from 'body-parser';
import { TokenService } from './services/token-service';
import { KeyStoreResult } from './services/key-store-service';
import { Application } from '~express/lib/application';
import { Server } from 'http';
import { routesFactory } from './routes/index';
import { UserService } from './services/user-service';

export interface IApp extends Application {
    keyStoreResult: KeyStoreResult;
    config: IConfig;
    keyStoreService: KeyStoreService;
    tokenService: TokenService;
    server: Server;
}

export interface IAppRequest extends Request, ParsedAsJson {
    app: IApp;
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

export async function start(config: IConfig = {} as any): Promise<IApp> {
    config = Object.assign({}, env, config);
    const app: IApp = express() as IApp;
    app.config = config;

    const keyStoreStrategy = StrategyUtils.requireKeyStoreStrategy(config.KEY_STORE_STRATEGY, {});
    app.keyStoreService = new KeyStoreService(keyStoreStrategy);
    app.tokenService = new TokenService();

    const userService = new UserService({
        findUserUrl: config.FIND_USER_URL,
        getUserUrl: config.GET_USER_URL,
    });

    routesFactory(app, app.tokenService, userService, app.keyStoreService);

    app.keyStoreResult = await app.keyStoreService.initRsa();

    return new Promise<IApp>(resolve => {
        app.server = app.listen(config.PORT, function (): void {
            console.log('Server started at port ' + config.PORT);
            resolve(app);
        });
    });
}

if (!module.parent) {
    start(env);
}
