import config from '../config';
import TokenService from '../services/token-service';
import MongoStrategy from '../services/user-store-strategies/mongo-strategy';
import UserService from '../services/user-service';
import KeyStoreService from '../services/key-store-service';
import MemoryStrategy from '../services/key-store-strategies/memory-strategy';

describe('Test token', () => {
        let tokenService, userService, keyStoreService, rsa;
        before(async() => {
            const mongoStrategy = new MongoStrategy();
            userService = new UserService(mongoStrategy);

            tokenService = new TokenService(userService);

            const keyStoreStrategy = new MemoryStrategy();
            keyStoreService = new KeyStoreService(keyStoreStrategy);

            rsa = await keyStoreService.initRsa();

            mongoStrategy.db.setDb(await mongoStrategy.db.createDb(config.MONGO_URL_TEST));
            await mongoStrategy.db.clearCollectionUser();
        });

        it('should create valid token', async() => {
            const signedToken = await tokenService.createToken({sub: 'dog', revokeId: 1234}, rsa.exportKey(), {sid: '1234'});
            const decoded = tokenService.decodeToken(signedToken);
            assert.deepEqual(decoded.payload.sub, 'dog');
            assert.isTrue(/[0-9]/.test(decoded.payload.exp));
            assert.isTrue(/[0-9]/.test(decoded.payload.iat));
            assert.equal(decoded.header.alg, 'RS256');
            assert.equal(decoded.header.typ, 'JWT');
        });

        it('should verify token', async() => {
            const userData = await userService.createUser({username: 'username', email: 'email@email', password: '12345678'});
            const signedToken = await tokenService.createToken(Object.assign({}, {sub: userData._id, revokeId: userData.revokeId}), this.rsa.exportKey(), {sid: '1234'});
            const verified = await tokenService.verifyToken(signedToken, this.rsa.exportKey('public'));
            assert.isTrue(verified);
        });
    }
);
