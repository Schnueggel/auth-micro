/**
 * TODO add logging
 * TODO use passport
 * TODO add facebook, github, google auth
 * TODO add integration tests
 * TODO add Docker
 * TODO add tslint
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
import { UserNotFoundError, UserDataNotValidError } from './errors';
import { Server } from 'http';

export interface App extends Application {
    keyStoreResult: KeyStoreResult
}

export interface IAppRequest extends Request, ParsedAsJson {
    app: App;
}

let server: Server;

export async function stop(): Promise<void> {
    if (!server) {
        return Promise.resolve();
    }
    return new Promise((resolve: Function) => {
        server.close(() => {
            resolve();
        });
    });
}

export async function start(config: IConfig): Promise<Server> {
    const app: App = express() as App;

    await stop();

    const userStrategy = StrategyUtils.requireUserStoreStrategy(config.USER_STORE_STRATEGY);
    const keyStoreStrategy = StrategyUtils.requireKeyStoreStrategy(config.KEY_STORE_STRATEGY);
    const userService = new UserService(userStrategy);
    const keyStoreService = new KeyStoreService(keyStoreStrategy);
    const tokenService = new TokenService();
    // Middleware
    const bodyParserJson = bodyParser.json();
    const tokenVerify = tokenVerifyCreator(tokenService, keyStoreService);
    const userFromToken = userFromTokenCreator(userService);
    const checkUserParam = checkUserParamCreator('id');

    app.post('/auth', bodyParserJson, async(req: IAppRequest, res: Response) => {
        if (!req.body.username || !req.body.password) {
            res.status(400);
            res.json({
                message: 'Invalid Data'
            });
            return;
        }

        try {
            const user = await userService.findUsernamePassword(req.body.username, req.body.password);

            if (!user) {
                res.status(401);
                res.json({
                    message: 'Auth failed'
                });
                return;
            }

            const tokens = await tokenService.createTokensFromUser(user, req.app.keyStoreResult.privateKey, req.app.keyStoreResult.uid);

            res.json(tokens);
        } catch (err) {
            if (err instanceof UserDataNotValidError) {
                res.status(422);
                res.json({message: err.message});
                return;
            }
            console.error(err);
            res.status(500);
            res.json({message: err.message});
        }
    });

    type IRefreshRequest = IAppRequest & IUserFromTokenRequest;

    app.post('/refresh', bodyParserJson, tokenExists, tokenVerify, userFromToken, async(req: IRefreshRequest, res: Response) => {
        try {
            if (!req.tokenData.payload.refresh) {
                res.status(400);
                res.json({
                    message: 'Not a refresh token'
                });
                return;
            }

            const token = await tokenService.createTokenFromUser(req.tokenUser, req.app.keyStoreResult.privateKey, req.app.keyStoreResult.uid);

            res.json({token});
        } catch (err) {
            console.error(err);
            res.status(500);
            res.json({message: 'Service failed'});
        }
    });

    type DeleteUserRequest = IAppRequest & ICheckUserFromParamRequest;

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

    type PutUserRequest = IAppRequest & ICheckUserFromParamRequest;

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
