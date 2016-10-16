import * as express from 'express';
import config from './config';
import { Request } from '~express/lib/request';
import { Response } from '~express/lib/response';
import UserService from './services/user-service';
import * as StrategyUtils from './utils/strategy-utils';
import KeyStoreService from './services/key-store-service';
import * as bodyParser from 'body-parser';
import { ParsedAsJson } from 'body-parser';
import TokenService from './services/token-service';
import { KeyStoreResult } from './services/key-store-service';
import { Application } from '~express/lib/application';
import { tokenExists, tokenVerifyCreator, userFromTokenCreator, IUserRequest } from './middleware/token-middleware';

export interface App extends Application {
    keyStoreResult: KeyStoreResult
}

export interface IAppRequest extends Request, ParsedAsJson {
    app: App;
}

const app: App = express() as App;

const bodyParserJson = bodyParser.json();

const userStrategy = StrategyUtils.requireUserStoreStrategy(config.USER_STORE_STRATEGY);
const userService = new UserService(userStrategy);

const keyStoreStrategy = StrategyUtils.requireKeyStoreStrategy(config.KEY_STORE_STRATEGY);
const keyStoreService = new KeyStoreService(keyStoreStrategy);

const tokenService = new TokenService();

const tokenVerify = tokenVerifyCreator(tokenService, keyStoreService);
const userFromToken = userFromTokenCreator(userService);

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
        console.error(err);
        res.status(500);
        res.send(err.message);
    }
});

app.post('/refresh', bodyParserJson, tokenExists, tokenVerify, userFromToken, async(req: IUserRequest, res: Response) => {
    try {
        if (!req.tokenData.payload.refresh) {
            res.status(400);
            res.json({
                message: 'Not a refresh token'
            });
            return;
        }

        const token = await tokenService.createTokenFromUser(req.user, req.app.keyStoreResult.privateKey, req.app.keyStoreResult.uid);

        res.json({token});
    } catch (err) {
        console.error(err);
        res.status(500);
        res.json({message: 'Service failed'});
    }
});

app.delete('/user/:id', bodyParserJson, tokenExists, tokenVerify, userFromToken, async(req: IUserRequest, res: Response) => {
    try {
        const userId = String(req.user._id);
        if (userId !== req.params['id'] && !req.user.isAdmin) {
            res.status(403);
            res.json({
                message: 'Not enough permissions'
            });
        }

        let deleted: boolean;
        if (config.TRUE_DELETE_ENABLED) {
            deleted = await userService.deleteUser(userId);
        } else {
            console.log(await userService.updateUser(userId, {deleted: true}));
            deleted = !!(await userService.updateUser(userId, {deleted: true}));

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

export async function start() {
    app.keyStoreResult = await keyStoreService.initRsa();
    app.listen(config.PORT, function () {
        console.log('Server started at port ' + config.PORT);
    });
}

if (!module.parent) {
    start();
}

export default app;
