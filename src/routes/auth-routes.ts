import * as bodyParser from 'body-parser';
import { TokenService } from '../services/token-service';
import { UserService } from '../services/user-service';
import { KeyStoreService } from '../services/key-store-service';
import { IAppRequest, IApp } from '../server';
import { Response } from '~express/lib/response';
import { tokenExists, tokenVerifyCreator, userFromTokenCreator, IUserFromTokenRequest } from '../middleware';
const bodyParserJson = bodyParser.json();

export type IRefreshRequest = IAppRequest & IUserFromTokenRequest;

export interface IAuthResponse {
    token: string;
    refreshToken: string;
}

export interface IRefreshResponse {
    token: string;
}

export function authRoutesFactory(app: IApp, tokenService: TokenService, userService: UserService, keyStoreService: KeyStoreService): void {
    const passwordjs = require('passport');
    const passport = new passwordjs.Passport();
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
            res.json({message: err.message});
        }
    });

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
}
