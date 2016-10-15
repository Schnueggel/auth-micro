import { UserStrategy, UserModel, UserData } from '../user-service';
import config from './../../config';
import * as bcrypt from 'bcrypt';
import { ObjectID } from 'mongodb';
import { UserDataNotValidError, UserAlreadyExistError, FetchingUserError } from '../../errors';
import MongoDb from './mongo-db';

class MongoStrategy implements UserStrategy {
    private emailRegex: RegExp = /[^ @]*@[^ @]*/;
    public db: MongoDb;

    constructor(db?: MongoDb) {
        if (!db) {
            this.db = new MongoDb();
        } else {
            this.db = db;
        }
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

    public comparePassword(password: string, current: string): Promise<string> {
        return new Promise(
            (resolve, reject) => {
                const equal = bcrypt.compareSync(password, current);
                if (equal) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        );
    }

    public isValidUserData(data: UserData): UserDataNotValidError {
        if (typeof data !== 'object') {
            return new UserDataNotValidError('Invalid User data');
        } else if (typeof data.password !== 'string' || data.password.length < config.PASSWORD_LENGTH) {
            return new UserDataNotValidError('Invalid password. Minimum length ' + config.PASSWORD_LENGTH);
        } else if (data.password.length > 250) {
            return new UserDataNotValidError('Invalid password. Maximum length 250');
        } else if (new RegExp(config.PASSWORD_REGEX).test(data.password) === false) {
            return new UserDataNotValidError('Invalid password');
        } else if (config.ENABLE_USERNAME && (typeof data.username !== 'string' || data.username.length < 1 || data.username.indexOf('@') > -1)) {
            return new UserDataNotValidError('Invalid username');
        } else if (!this.emailRegex.test(data.email)) {
            return new UserDataNotValidError('Invalid email');
        }

        return null;
    }
}

export default MongoStrategy;
