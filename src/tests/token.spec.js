const token = require('../token');
const assert = require('chai').assert;
const describe = require('mocha').describe;
const it = require('mocha').it;
const before = require('mocha').before;
const db = require('../db');
const config = require('../config');
const user = require('../user');
const jwt = require('jsonwebtoken');

describe('Test token', () => {
    before(async () => {
        db.setDb(await db.createDb(config.MONGO_URL_TEST));
        await db.clearCollectionUser();
    });
    it('should create valid token', async () => {
        const signedToken = await token.createToken({_id:'dog'});
        const decoded = jwt.decode(signedToken, {complete: true});
        assert.deepEqual(decoded.payload.sub, 'dog');
        assert.isTrue(/[0-9]/.test(decoded.payload.exp));
        assert.isTrue(/[0-9]/.test(decoded.payload.iat));
        assert.equal(decoded.header.alg, 'RS256');
        assert.equal(decoded.header.typ, 'JWT');
    });

    it('should verify token', async () => {
        const userData = await user.createUser({username: 'username', email: 'email@email', password: '12345678'});
        const signedToken = await token.createToken(userData);
        const verfified = await token.verifyToken(signedToken);
        assert.isTrue(verfified);
    });
});
