import * as request from 'request-promise-native';
import { assert }  from 'chai';
import { start } from '../server';
import { UrlOptions } from 'request';
import { RequestPromiseOptions } from 'request-promise-native';
import { IncomingMessage } from 'http';
import { Server } from 'http';

describe('route auth', () => {
    let app: Server;
    let options: RequestPromiseOptions & UrlOptions;

    before(async function (): void {
        this.timeout(20000);
        app = await start();
    });

    after((done) => {
        app.close(() => done());
    });

    beforeEach(() => {
        options = {
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

    it('should reject invalid login attempt with 400', async() => {
        try {
            await request(options as UrlOptions) as IncomingMessage;
            assert.isFalse(true);
        } catch (err) {
            assert.equal(err.response.statusCode, 400);
            assert.deepEqual(err.response.body, {message: 'Invalid Data'});
        }
    });

    it('should reject invalid login attempt with 400 if password is missing', async() => {
        try {
            options.body = {
                username: 'username'
            };
            await request(options as UrlOptions) as IncomingMessage;
            assert.isFalse(true);
        } catch (err) {
            assert.equal(err.response.statusCode, 400);
            assert.deepEqual(err.response.body, {message: 'Invalid Data'});
        }
    });

    it('should reject invalid login attempt with 400 if username is missing', async() => {
        try {
            options.body = {
                password: '123456'
            };
            await request(options as UrlOptions) as IncomingMessage;
            assert.isFalse(true);
        } catch (err) {
            assert.equal(err.response.statusCode, 400);
            assert.deepEqual(err.response.body, {message: 'Invalid Data'});
        }
    });
});
