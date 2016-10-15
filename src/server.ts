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
import { TokenExpiredError } from 'jsonwebtoken';
import { UserNotFoundError, InvalidRevokeId } from './errors/index';

export interface App extends Application {
    keyStoreResult: KeyStoreResult
}

export interface AppRequest extends Request, ParsedAsJson {
    app: App;
}

const app: App = express() as App;

const bodyParserJson = bodyParser.json();

const userStrategy = StrategyUtils.requireUserStoreStrategy(config.USER_STORE_STRATEGY);
const userService = new UserService(userStrategy);

const keyStoreStrategy = StrategyUtils.requireKeyStoreStrategy(config.KEY_STORE_STRATEGY);
const keyStoreService = new KeyStoreService(keyStoreStrategy);

const tokenService = new TokenService(userService);

app.post('/auth', bodyParserJson, async(req: AppRequest, res: Response) => {
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

app.post('/refresh', bodyParserJson, async(req: AppRequest, res: Response) => {
    if (!req.body.token) {
        res.status(400);
        res.json({
            message: 'Invalid Data'
        });
        return;
    }
    try {
        const tokenData = await tokenService.decodeToken(req.body.token);

        if (!tokenData || !tokenData.payload.refresh) {
            res.status(400);
            res.json({
                message: 'Not a refresh token'
            });
            return;
        }

        const publicKey = await keyStoreService.get(tokenData.header.sid);

        if (!publicKey) {
            res.status(401);
            res.json({
                message: 'Token lost'
            });
            return;
        }

        await tokenService.verifyToken(req.body.token, publicKey);

        const user = await userService.find(tokenData.payload.sub);

        // TODO handle user delete disabled
        if (!user) {
            res.status(401);
            res.json({message: 'User not found'});
            return;
        }

        const token = await tokenService.createTokenFromUser(user, req.app.keyStoreResult.privateKey, req.app.keyStoreResult.uid);

        res.json({token});
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            res.status(401);
            res.json({message: 'Token expired'});
        } else if (err) {
            console.error(err);
            res.status(500);
        }
        res.json({message:'Service failed'});
    }
});

export async function start() {
    app.keyStoreResult = await keyStoreService.initRsa();
    app.listen(config.PORT, function () {
    });
    console.log('Server started at port ' + config.PORT);
}

if (!module.parent) {
    start();
}

export default app;
