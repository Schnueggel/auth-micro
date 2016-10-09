const token = require('../token');
const assert = require('chai').assert;
const describe = require('mocha').describe;
const it = require('mocha').it;
const before = require('mocha').before;
const db = require('../db');
const config = require('../config');
const jwt = require('jsonwebtoken');

describe('Test token', () => {
    it('should create valid token', async () => {
        const signedToken = await token.createToken('dog');
        const decoded = jwt.decode(signedToken, {complete: true});
        assert.deepEqual(decoded.payload.sub, 'dog');
        assert.isTrue(/[0-9]/.test(decoded.payload.exp));
        assert.isTrue(/[0-9]/.test(decoded.payload.iat));
        assert.equal(decoded.header.alg, 'RS256');
        assert.equal(decoded.header.typ, 'JWT');
    });

    it('should verify token', async () => {
        const signedToken = await token.createToken('dog');
        const verfified = await token.verifyToken(signedToken);
        assert.equal(verfified.sub, 'dog');
    });
});
