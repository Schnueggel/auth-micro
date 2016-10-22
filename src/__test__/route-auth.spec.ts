import * as request from 'request-promise-native';
import test  from 'ava';
import { start } from '../server';
import { UrlOptions } from 'request';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { ContextualTestContext } from 'ava';
import { MongoStrategy } from '../services/user-store-strategies/mongo-strategy';
import { UserService, IUserModel } from '../services/user-service';
import { Response } from 'http';

let app: Server;
let userService: UserService;
let user: IUserModel;

test.before(async() => {
    const mongoStrategy = new MongoStrategy({
        url: 'localhost:27017/auth-micro-test'
    });

    await mongoStrategy.db.clearCollectionUser();
    userService = new UserService(mongoStrategy);

    user = await userService.createUser({
        username: 'test',
        email: 'test@email.de',
        password: '12345678'
    });

    app = await start({
        userStrategyOptions: {
            url: 'localhost:27017/auth-micro-test'
        }
    });
});
/* tslint:disable */
(test.after as any).always(async() => {
    await new Promise((resolve) => app && app.close(resolve) || resolve());
});
/* tslint:enable */

test.beforeEach((t: ContextualTestContext) => {
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
        await request(t.context.options as UrlOptions) as IncomingMessage;
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
        await request(t.context.options as UrlOptions) as IncomingMessage;
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
        await request(t.context.options as UrlOptions) as IncomingMessage;
        t.false(true);
    } catch (err) {
        t.is(err.response.statusCode, 400);
        t.is(err.response.body.message, 'Invalid Data');
    }
});

test('should auth user by email', async t => {
    try {
        t.context.options.body = {
            username: 'test@email.de',
            password: '12345678'
        };
        const response = await request(t.context.options as UrlOptions) as Response<Object>;
        t.is(response.statusCode, 200);
    } catch (err) {
        t.false(err);
    }
});
