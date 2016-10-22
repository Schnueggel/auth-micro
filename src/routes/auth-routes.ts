import * as bodyParser from 'body-parser';
import { TokenService } from '../services/token-service';
import { UserService } from '../services/user-service';
import { KeyStoreService } from '../services/key-store-service';
import { IAppRequest, IApp, IFacebookProfile } from '../server';
import { UserDataNotValidError } from '../errors';
import { Response } from '~express/lib/response';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { tokenExists, enableRouteCreator, tokenVerifyCreator, userFromTokenCreator, IUserFromTokenRequest } from '../middleware';
const bodyParserJson = bodyParser.json();

export type IRefreshRequest = IAppRequest & IUserFromTokenRequest;

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

    if (app.config.AUTH_FACEBOOK) {
        const facebookStrategy = new FacebookStrategy({
                clientID: app.config.FACEBOOK_APP_ID,
                clientSecret: app.config.FACEBOOK_APP_SECRET,
                callbackURL: app.config.FACEBOOK_CALLBACK_URL,
                profileFields: ['id', 'email'].concat(app.config.FACEBOOK_PROFILE_FIELDS)
            },
            async function (accessToken: string, refreshToken: string, profile: IFacebookProfile, cb: Function): void {
                try {
                    let user = await userService.findFacebookUser(profile.id);

                    if (!user) {
                        user = await userService.createUser({facebookId: profile.id, email: profile.email});
                    }
                    // TODO go on
                } catch (err) {
                    cb(err, null);
                }
            }
        );

        passport.use('facebook', facebookStrategy);
    }

    app.post('/auth/facebook', enableRouteCreator(app.config.AUTH_FACEBOOK), async(req: IRefreshRequest, res: Response, next: Function) => {
        passport.authenticate('facebook', function (err: Error, user: Object, info: Object): void {
            console.error(err);
        })(req, res, next);
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
