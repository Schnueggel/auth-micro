/**
 * TODO add logging
 * TODO add facebook, github, google auth
 * TODO add integration tests
 * TODO add Docker
 */
import * as express from 'express';
import { config as env, IConfig } from './config';
import { Request } from '~express/lib/request';
import { Response } from '~express/lib/response';
import { UserService } from './services/user-service';
import * as StrategyUtils from './utils/strategy-utils';
import { KeyStoreService } from './services/key-store-service';
import * as bodyParser from 'body-parser';
import { ParsedAsJson } from 'body-parser';
import { TokenService } from './services/token-service';
import { KeyStoreResult } from './services/key-store-service';
import { Application } from '~express/lib/application';
import {
    tokenExists, tokenVerifyCreator, userFromTokenCreator, checkUserParamCreator, IUserFromTokenRequest, ICheckUserFromParamRequest
} from './middleware';
import { isEmpty, pick } from 'lodash';
import { IUserData } from './services/user-service';
import { IUserModel } from './services/user-service';
import { UserNotFoundError } from './errors';
import { Server } from 'http';
import { Profile } from 'passport-facebook';
import { IHash } from './types';
import { routesFactory } from './routes/index';

export interface IApp extends Application {
    keyStoreResult: KeyStoreResult;
    config: IConfig;
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

let server: Server;

export interface IAuthResponse {
    token: string;
    refreshToken: string;
}

export type IRefreshRequest = IAppRequest & IUserFromTokenRequest;
export type DeleteUserRequest = IAppRequest & ICheckUserFromParamRequest;
export type PutUserRequest = IAppRequest & ICheckUserFromParamRequest;

export async function stop(): Promise<void> {
    if (!server) {
        return Promise.resolve();
    }
    return new Promise<void>((resolve: Function) => {
        server.close(() => {
            resolve();
        });
    });
}

export async function start(config?: IConfig & IStrategyOptions): Promise<Server> {
    config = Object.assign({}, env, config);
    const app: IApp = express() as IApp;
    app.config = config;

    await stop();

    const userStrategy = StrategyUtils.requireUserStoreStrategy(config.USER_STORE_STRATEGY, config.userStrategyOptions);
    const keyStoreStrategy = StrategyUtils.requireKeyStoreStrategy(config.KEY_STORE_STRATEGY, config.keyStoryStrategyOptions);
    const userService = new UserService(userStrategy);
    const keyStoreService = new KeyStoreService(keyStoreStrategy);
    const tokenService = new TokenService();
    // Middleware
    const bodyParserJson = bodyParser.json();
    const tokenVerify = tokenVerifyCreator(tokenService, keyStoreService);
    const userFromToken = userFromTokenCreator(userService);
    const checkUserParam = checkUserParamCreator('id');

    routesFactory(app, tokenService, userService, keyStoreService);

    app.delete('/user/:id', bodyParserJson, tokenExists, tokenVerify, userFromToken, checkUserParam, async(req: DeleteUserRequest, res: Response) => {
        try {
            let deleted: boolean;
            if (config.TRUE_DELETE_ENABLED) {
                deleted = await userService.deleteUser(req.userId);
            } else {
                console.log(await userService.updateUser(req.userId, {deleted: true}));
                deleted = !!(await userService.updateUser(req.userId, {deleted: true}));
            }

            if (deleted) {
                res.status(200);
                res.end();
            }
        } catch (err) {
            console.error(err);
            res.status(500);
            res.json({message: 'Service failed'});
        }
    });

    app.put('/user/:id', bodyParserJson, tokenExists, tokenVerify, userFromToken, checkUserParam, async(req: PutUserRequest, res: Response) => {
        try {
            let data = req.body && req.body.data;
            if (typeof data !== 'object' || isEmpty(data)) {
                res.status(204);
                res.end();
                return;
            }

            const userData: IUserData = pick<IUserData, any>(data, ['username', 'email', 'isAdmin', 'password']);

            if (!req.tokenUser.isAdmin) {
                delete userData.isAdmin;
            }

            if (isEmpty(data)) {
                res.status(204);
                res.end();
                return;
            }

            let updatedUser = await userService.updateUser(req.userId, userData);

            res.status(200);
            res.json(pick<IUserModel, IUserModel>(updatedUser, ['username', 'email', 'isAdmin', '_id']));
        } catch (err) {
            if (err instanceof UserNotFoundError) {
                res.status(404);
                res.send('Could not find user');
                return;
            }
            console.error(err);
            res.status(500);
            res.json({message: 'Service failed'});
        }
    });

    app.keyStoreResult = await keyStoreService.initRsa();

    return new Promise<Server>(resolve => {
        server = app.listen(config.PORT, function () {
            console.log('Server started at port ' + config.PORT);
            resolve(server);
        });
    });
}

if (!module.parent) {
    start(env);
}
