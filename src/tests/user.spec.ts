import { assert }  from 'chai';
import MongoStrategy from '../services/user-store-strategies/mongo-strategy';
import UserService from '../services/user-service';
import { UserAlreadyExistError, UserDataNotValidError } from '../errors';

describe('Test user', () => {
    let userService, mongoStrategy;
    before(async() => {
        mongoStrategy = new MongoStrategy();
        userService = new UserService(mongoStrategy);
        await mongoStrategy.db.clearCollectionUser();
    });

    it('should create user', async() => {
        const user = {
            email: 'test@test.de',
            username: 'test2',
            password: '12345678'
        };
        const result = await userService.createUser(user);
        assert.equal(result.email, user.email);
        assert.equal(result.username, user.username);
        assert.notEqual(result.password, user.password);
        assert.isTrue(await mongoStrategy.comparePassword(user.password, result.password));
    });

    it('should not create duplicate user', async() => {
        const user = {
            email: 'test@test.de',
            username: 'test2',
            password: '12345678'
        };
        try {
            const result = await userService.createUser(user);
            assert.isFalse(result);
        } catch (err) {
            assert.isTrue(err instanceof Error);
            assert.isTrue(err instanceof UserAlreadyExistError);
            assert.equal(err.message, 'User already exists');
        }
    });

    it('should not create invalid user', async() => {
        const user = {
            email: '',
            username: 'test2',
            password: '12345678'
        };

        try {
            const result = await userService.createUser(user);
            assert.isFalse(result);
        } catch (err) {
            assert.isTrue(err instanceof Error);
            assert.isTrue(err instanceof UserDataNotValidError);
            assert.equal(err.message, 'Invalid email');
        }
    });
});
