import * as requestPromise from 'request-promise-native';
import test  from 'ava';
import { start, IApp, stop } from '../server';
import { UrlOptions } from 'request';
import { IncomingMessage } from 'http';
import { ContextualTestContext } from 'ava';
import { IUserModel } from '../services/user-service';
import { Response } from 'http';
import { IAuthResponse } from '../routes/auth-routes';
import { importEnvFromFile } from '../utils/env-utils';

let app: IApp;
let user: IUserModel;
let user2: IUserModel;

test.before(async() => {
    importEnvFromFile(__dirname + '/auth.env');
    app = await start();
    const _user = await app.userService.findUser('test');
    const _user2 = await app.userService.findUser('test2');

    await app.userService.deleteUser(_user && _user._id);
    await app.userService.deleteUser(_user2 && _user2._id);

    user = await app.userService.createUser({
        username: 'test',
        email: 'test@email.com',
        password: '12345678'
    });
    user2 = await app.userService.createUser({
        username: 'test2',
        email: 'test2@email.com',
        password: '12345678'
    });
});
/* tslint:disable */
(test.after as any).always(async() => {
    await new Promise((resolve) => app && app.server.close(resolve) || resolve());
});
/* tslint:enable */

test.beforeEach((t: ContextualTestContext) => {
    // TODO split options into refresh and auth
    t.context.options = {
        method: 'POST',
        uri: 'http://localhost:9999/auth',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json'
        },
        resolveWithFullResponse: true,
        body: {},
        json: true
    };
});

test('should reject invalid login attempt with 400', async t => {
    try {
        await requestPromise(t.context.options as UrlOptions) as IncomingMessage;
    } catch (err) {
        t.is(err.response.statusCode, 400);
        t.is(err.response.body.message, 'Invalid Data');
    }
});

test('should reject invalid login attempt with 400 if password is missing', async t => {
    try {
        t.context.options.body = {
            username: 'username'
        };
        await requestPromise(t.context.options as UrlOptions) as IncomingMessage;
        t.false(true);
    } catch (err) {
        t.is(err.response.statusCode, 400);
        t.is(err.response.body.message, 'Invalid Data');
    }
});

test('should reject invalid login attempt with 400 if username is missing', async t => {
    try {
        t.context.options.body = {
            password: '123456'
        };
        await requestPromise(t.context.options as UrlOptions) as IncomingMessage;
        t.false(true);
    } catch (err) {
        t.is(err.response.statusCode, 400);
        t.is(err.response.body.message, 'Invalid Data');
    }
});

test('should auth user by email', async t => {
    t.context.options.body = {
        username: 'test@email.com',
        password: '12345678'
    };
    /* tslint:disable */
    const response: Response<IAuthResponse> = (await requestPromise(t.context.options as UrlOptions) as any) as Response<IAuthResponse>;
    /* tslint:enable */
    t.is(response.statusCode, 200);
    t.regex(response.body.token, /.+\..+\..+/);
    t.regex(response.body.refreshToken, /.+\..+\..+/);

});

test('should auth user by username', async t => {
    t.context.options.body = {
        username: 'test',
        password: '12345678'
    };
    /* tslint:disable */
    const response: Response<IAuthResponse> = (await requestPromise(t.context.options as UrlOptions) as any) as Response<IAuthResponse>;
    /* tslint:enable */
    t.is(response.statusCode, 200);
    t.regex(response.body.token, /.+\..+\..+/);
    t.regex(response.body.refreshToken, /.+\..+\..+/);
});

test('should reject login with wrong credentials', async t => {
    try {
        t.context.options.body = {
            username: 'dddd',
            password: '123456'
        };
        await requestPromise(t.context.options as UrlOptions) as IncomingMessage;
        t.false(true);
    } catch (err) {
        t.is(err.response.statusCode, 401);
        t.is(err.response.body.message, 'Auth failed');
    }
});

test('should reject refresh without token', async t => {
    try {
        await requestPromise(Object.assign({}, t.context.options, {
            uri: 'http://localhost:9999/refresh',
            body: {}
        }) as UrlOptions);
        t.false(true);
    } catch (err) {
        t.is(err.response.statusCode, 400);
        t.is(err.response.body.message, 'Missing Token');
    }
});

test('should reject refresh without valid token', async t => {
    try {
        await requestPromise(Object.assign({}, t.context.options, {
            uri: 'http://localhost:9999/refresh',
            body: {
                token: '123'
            }
        }) as UrlOptions);
        t.false(true);
    } catch (err) {
        t.is(err.response.statusCode, 400);
        t.is(err.response.body.message, 'Not a valid token');
    }
});

test('should refresh auth with valid refresh token', async t => {
    t.context.options.body = {
        username: 'test',
        password: '12345678'
    };
    /* tslint:disable */
    const response: Response<IAuthResponse> = (await requestPromise(t.context.options as UrlOptions) as any) as Response<IAuthResponse>;
    /* tslint:enable */

    await requestPromise(Object.assign({}, t.context.options, {
        uri: 'http://localhost:9999/refresh',
        body: {
            token: response.body.refreshToken
        }
    }) as UrlOptions);

    t.is(response.statusCode, 200);
    t.regex(response.body.token, /.+\..+\..+/);
});

test.serial('should reject refresh without valid user', async t => {
    try {
        t.context.options.body = {
            username: 'test2',
            password: '12345678'
        };
        /* tslint:disable */
        const response: Response<IAuthResponse> = (await requestPromise(t.context.options as UrlOptions) as any) as Response<IAuthResponse>;
        /* tslint:enable */

        app.userService.deleteUser(user2._id);
        await requestPromise(Object.assign({}, t.context.options, {
            uri: 'http://localhost:9999/refresh',
            body: {
                token: response.body.refreshToken
            }
        }) as UrlOptions);
        t.fail('Expecting Exception to be thrown');
    } catch (err) {
        t.is(err.response.statusCode, 404);
        t.is(err.response.body.message, 'User not found');
    }
});

test.serial('should reject refresh without valid publickey', async t => {
    try {
        t.context.options.body = {
            username: 'test',
            password: '12345678'
        };
        /* tslint:disable */
        const response: Response<IAuthResponse> = (await requestPromise(t.context.options as UrlOptions) as any) as Response<IAuthResponse>;
        /* tslint:enable */

        const tokenData = app.tokenService.decodeToken(response.body.token);

        t.regex(tokenData.header.sid, /.{32}/);

        t.true(await app.keyStoreService.del(tokenData.header.sid));

        await requestPromise(Object.assign({}, t.context.options, {
            uri: 'http://localhost:9999/refresh',
            body: {
                token: response.body.refreshToken
            }
        }) as UrlOptions);
        t.fail('Expecting Exception to be thrown');
    } catch (err) {
        t.is(err.response.statusCode, 401);
        t.is(err.response.body.message, 'Token lost');
    }
    // test.serial.after seems not to work
    await stop(app);
    // We need to start the app again to get a new publicKey
    app = await start();
});
