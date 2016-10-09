const assert = require('chai').assert;
const describe = require('mocha').describe;
const it = require('mocha').it;
const before = require('mocha').before;
const userModel = require('../../dist/user');
const db = require('../../dist/db');
const config = require('../../dist/config');

describe('Test user', () => {
    before(async () => {
        db.setDb(await db.createDb(config.MONGO_URL_TEST));
        await db.clearCollectionUser();
    });

    it('should create user', async () => {
        const user = {
            email: 'test@test.de',
            username: 'test2',
            password: '12345678'
        };
        const result = await userModel.createUser(user);
        assert.equal(result.email, user.email);
        assert.equal(result.username, user.username);
        assert.notEqual(result.password, user.password);
        assert.isTrue(await userModel.comparePassword(user.password, result.password));
    });

    it('should not create duplicate user', async () => {
        const user = {
            email: 'test@test.de',
            username: 'test2',
            password: '12345678'
        };
        const result = await userModel.createUser(user);
        assert.isTrue(result instanceof Error);
    });
});
