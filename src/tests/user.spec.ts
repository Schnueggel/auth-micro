const assert = require('chai').assert;
const userModel = require('../services/user');
const db = require('../services/user-store-strategies/mongo-db');
const config = require('../config');

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
        try {
            const result = await userModel.createUser(user);
            assert.isFalse(result);
        } catch (err) {
            assert.isTrue(err instanceof Error);
            assert.equal(err.message, 'Creating user failed');
        }
    });

    it('should not create invalid user', async () => {
        const user = {
            email: '',
            username: 'test2',
            password: '12345678'
        };
        try {
            const result = await userModel.createUser(user);
            assert.isFalse(result);
        } catch (err) {
            assert.isTrue(err instanceof Error);
            assert.equal(err.message, 'Invalid email');
        }
    });
});
