import { IAppRequest } from '../server';
import { Response } from '~express/lib/response';
import TokenService from '../services/token-service';
import KeyStoreService from '../services/key-store-service';
import { TokenExpiredError } from 'jsonwebtoken';
import { ITokenData } from '../services/token-service';
import UserService from '../services/user-service';
import { IUserModel } from '../services/user-service';

export interface ITokenRequest extends IAppRequest {
    tokenData: ITokenData;
}

export interface IUserRequest extends ITokenRequest {
    user: IUserModel;
}

export function tokenExists(req: IAppRequest, res: Response, next: Function) {
    if (!req.body.token) {
        res.status(400);
        res.json({
            message: 'Missing Token'
        });
        return;
    } else {
        next();
    }
}

export function tokenVerifyCreator(tokenService: TokenService, keyStoreService: KeyStoreService) {
    return async(req: ITokenRequest, res: Response, next: Function) => {
        try {
            const tokenData = await tokenService.decodeToken(req.body.token);
            req.tokenData = tokenData;

            if (!tokenData) {
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
            next();
        } catch (err) {
            if (err instanceof TokenExpiredError) {
                res.status(401);
                res.json({message: 'Token expired'});
            } else if (err) {
                console.error(err);
                res.status(500);
            }
            res.json({message: 'Service failed'});
        }
    }
}

export function userFromTokenCreator(userService: UserService) {
    return async(req: IUserRequest, res: Response, next: Function) => {
        try {
            const user = await userService.find(req.tokenData.payload.sub);

            if (!user || user.deleted || user.disabled) {
                res.status(401);
                res.json({message: 'User not found'});
                return;
            }

            req.user = user;
            next();
        } catch (err) {
            console.error(err);
            res.status(500);
            res.json({message: 'Service failed'});
        }
    }
}
