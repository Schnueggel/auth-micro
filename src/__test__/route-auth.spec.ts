import * as request from 'request-promise-native';
import test  from 'ava';
import { start } from '../server';
import { UrlOptions } from 'request';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { ContextualTestContext } from 'ava';

let app: Server;

test.before(async() => {
    app = await start();
});
/* tslint:disable */
(test.after as any).always(async() => {
    await new Promise((resolve) => app && app.close(resolve) || resolve());
});
/* tslint:enable */
test.beforeEach((t: ContextualTestContext) => {
    t.context.options = {
        method: 'POST',
        url: 'http://localhost:9999/auth',
        headers: {
            accept: 'application/javascript',
            'content-type': 'application/javascript'
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
