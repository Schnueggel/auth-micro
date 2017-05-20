import { IAppRequest } from './server';
import { Response } from '~express/lib/response';
import { TokenService } from './services/token-service';
import { KeyStoreService } from './services/key-store-service';
import { TokenExpiredError } from 'jsonwebtoken';
import { ITokenData } from './services/token-service';
import { UserService } from './services/user-service';
import { IUserModel } from './services/user-service';
import { RequestHandler } from '~express/lib/express';
import { NextFunction } from '~express/lib/express';

export interface ITokenVerifyRequest {
    tokenData: ITokenData;
}

export interface IUserFromTokenRequest extends ITokenVerifyRequest {
    tokenUser: IUserModel;
}

export interface ICheckUserFromParamRequest extends IUserFromTokenRequest {
    userId: string;
}
/**
 * TODO load token from header or body and place it as request property token
 */
export function tokenExists(req: IAppRequest, res: Response, next: Function): void {
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

export function tokenVerifyCreator(tokenService: TokenService, keyStoreService: KeyStoreService): Function {
    return async(req: IAppRequest & ITokenVerifyRequest, res: Response, next: Function): Promise<any> => {
        try {
            const tokenData = await tokenService.decodeToken(req.body.token);
            req.tokenData = tokenData;

            if (!tokenData) {
                res.status(400);
                res.json({
                    message: 'Not a valid token'
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
    };
}

export function userFromTokenCreator(userService: UserService): Function {
    return async(req: IAppRequest & IUserFromTokenRequest, res: Response, next: Function): Promise<any> => {
        try {
            const user = await userService.find(req.tokenData.payload.sub);

            if (!user || user.deleted || user.disabled) {
                res.status(404);
                res.json({message: 'User not found'});
                return;
            }

            req.tokenUser = user;
            next();
        } catch (err) {
            console.error(err);
            res.status(500);
            res.json({message: 'Service failed'});
        }
    };
}

/**
 * Create a middleware that checks the user id in the route params against the id in the token.
 * If the ids do not match or the user of the token is not admin the check will fail
 * with Status code 403
 * TODO load user from param and change user from token to req param tokenUser
 * TODO config param for allow user self update
 */
export function checkUserParamCreator(name: string): Function {
    return (req: IAppRequest & ICheckUserFromParamRequest, res: Response, next: Function): Promise<any> => {
        const userId = String(req.tokenUser._id);
        if (userId !== req.params[name] && !req.tokenUser.isAdmin) {
            res.status(403);
            res.json({
                message: 'Not enough permissions'
            });
            return;
        }

        req.userId = userId;
        next();
    };
}

export function enableRouteCreator(enabled: boolean): RequestHandler {
    return (req: IAppRequest, res: Response, next: NextFunction): void => {
        if (!enabled) {
            res.status(404);
            return res.end();
        }
        next();
    };
}
