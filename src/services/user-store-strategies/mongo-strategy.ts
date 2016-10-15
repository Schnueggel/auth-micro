import { UserStoreStrategy, UserModel, UserData } from '../user-service';
import * as bcrypt from 'bcrypt';
import { ObjectID } from 'mongodb';
import { UserDataNotValidError, UserAlreadyExistError, FetchingUserError } from '../../errors';
import MongoDb from './mongo-db';
import * as EnvUtils from '../../utils/env-utils';

export interface IOptions {
    url?: string;
    usernameRegex?: RegExp;
    enableUsername?: boolean;
    emailRegex?: RegExp;
    passwordRegex?: RegExp;
}

class MongoStrategy implements UserStoreStrategy {
    private options: IOptions;
    public db: MongoDb;

    constructor(options?: IOptions) {
        this.setOptions(options);
        this.db = new MongoDb(this.options);
    }

    setOptions(options: IOptions) {
        this.options = Object.assign({
            emailRegex: EnvUtils.getRegExp('US_MONGO_STRATEGY_EMAIL_REGEX', /[^ @]*@[^ @]*/),
            usernameRegex: EnvUtils.getRegExp('US_MONGO_STRATEGY_USERNAME_REGEX', /^[a-zA-Z][0-9a-zA-Z]{1,20}$/),
            passwordRegex: EnvUtils.getRegExp('US_MONGO_STRATEGY_PASSWORD_REGEX', /^.{8,250}$/),
            url: EnvUtils.getString('US_MONGO_STRATEGY__URL', 'localhost:27017/auth-micro'),
            enableUsername: EnvUtils.getBoolean('US_MONGO_STRATEGY_ENABLE_USERNAME', true),
        }, options);
    }

    public async createUser(data): Promise<UserModel> {
        const validUserError = this.isValidUserData(data);
        if (validUserError instanceof UserDataNotValidError) {
            throw validUserError;
        }
        const collection = await this.db.getUsers();

        data = Object.assign(
            {
                isAdmin: false
            }, data, {
                createdAt: new Date().getTime(),
                updatedAt: null,
                revokeId: new Date().getTime(),
                password: await this.encryptPassword(data.password)
            }
        );

        const result = await collection.updateOne(
            {$or: [{username: data.username}, {email: data.email}]},
            {$setOnInsert: data},
            {upsert: true}
        );

        if (result.modifiedCount || result.upsertedId === null) {
            throw new UserAlreadyExistError('User already exists');
        }
        return await this.find(result.upsertedId._id);
    }

    public async updateUser(_id: string, data: UserData): Promise<UserModel> {
        return Promise.reject(null);
    }

    public async revoke(_id: string): Promise<boolean> {
        if (!_id) {
            throw new Error('Invalid argument _id');
        }

        const collection = await this.db.getUsers();
        const result = await collection.updateOne(
            {_id},
            {$set: {revokeId: new Date().now()}},
            {}
        );

        if (result.modifiedCount !== 1) {
            throw new Error('User not found');
        }

        return true;
    }

    public async find(_id: string | ObjectID): Promise<UserModel> {
        if (!_id) {
            throw null;
        }

        if (typeof _id === 'string') {
            _id = new ObjectID(_id as string);
        }

        try {
            const collection = await this.db.getUsers();
            return await collection.find({_id}).limit(1).next().then(result => result);
        } catch (err) {
            throw new FetchingUserError('Fetching user failed');
        }
    }

    public async findUser(username: string): Promise<UserModel> {
        let where = {$or: [{username}, {email: username}]};

        try {
            const collection = await this.db.getUsers();
            return await collection.find(where).limit(1).next().then(result => result);
        } catch (err) {
            console.error(err);
            throw new Error('Fetching user failed');
        }

    }

    public async findUsernamePassword(username: string, password: string): Promise<UserModel> {
        let where = {$or: [{username}, {email: username}]};

        try {
            const collection = await this.db.getUsers();
            const user: UserModel = await collection.find(where).limit(1).next().then(result => result);

            if (!user || !await this.comparePassword(password, user.password)) {
                return null;
            }
            return user;
        } catch (err) {
            console.error(err);
            throw new Error('Fetching user failed');
        }

    }

    public async deleteUser(_id: string): Promise<UserModel> {
        return Promise.reject(null);
    }

    public encryptPassword(password: string): Promise<string> {
        return new Promise(
            (resolve, reject) => {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(password, salt);
                resolve(hash);
            }
        );
    }

    public comparePassword(password: string, current: string): Promise<boolean> {
        return new Promise((resolve) => {
            const equal = bcrypt.compareSync(password, current);
            if (equal) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    public isValidUserData(data: UserData): UserDataNotValidError {
        if (typeof data !== 'object') {
            return new UserDataNotValidError('Invalid User data');
        } else if (this.options.passwordRegex.test(data.password) === false) {
            return new UserDataNotValidError('Invalid password');
        } else if (this.options.enableUsername && this.options.usernameRegex.test(data.username) === false) {
            return new UserDataNotValidError('Invalid username');
        } else if (!this.options.emailRegex.test(data.email)) {
            return new UserDataNotValidError('Invalid email');
        }

        return null;
    }
}

export default MongoStrategy;
