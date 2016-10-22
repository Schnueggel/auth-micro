import * as bodyParser from 'body-parser';
import { TokenService } from '../services/token-service';
import { UserService, IUserModel, IUserData } from '../services/user-service';
import { KeyStoreService } from '../services/key-store-service';
import { IApp, IAppRequest } from '../server';
import { UserNotFoundError } from '../errors';
import { Response } from '~express/lib/response';
import { isEmpty, pick } from 'lodash';
import { tokenExists, tokenVerifyCreator, userFromTokenCreator, checkUserParamCreator, ICheckUserFromParamRequest } from '../middleware';
const bodyParserJson = bodyParser.json();

export type IPutUserRequest = IAppRequest & ICheckUserFromParamRequest;
export type IDeleteUserRequest = IAppRequest & ICheckUserFromParamRequest;

export function userRoutesFactory(app: IApp, tokenService: TokenService, userService: UserService, keyStoreService: KeyStoreService): void {
    const passwordjs = require('passport');
    const passport = new passwordjs.Passport();
    const tokenVerify = tokenVerifyCreator(tokenService, keyStoreService);
    const userFromToken = userFromTokenCreator(userService);
    const checkUserParam = checkUserParamCreator('id');



    app.delete('/user/:id', bodyParserJson, tokenExists, tokenVerify, userFromToken, checkUserParam, async(req: IDeleteUserRequest, res: Response) => {
        try {
            let deleted: boolean;
            if (app.config.TRUE_DELETE_ENABLED) {
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

    app.put('/user/:id', bodyParserJson, tokenExists, tokenVerify, userFromToken, checkUserParam, async(req: IPutUserRequest, res: Response) => {
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
}
