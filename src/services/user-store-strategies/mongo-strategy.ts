import { UserStrategy, UserModel, UserData } from '../user';
const config = require('./../../config');
const bcrypt = require('bcrypt');
const db = require('../db');
const ObjectId = require('mongodb').ObjectId;
import { UserDataNotValidError, UserAlreadyExistError, FetchingUserError } from '../../errors';

class MongoStrategy implements UserStrategy {
    private emailRegex: RegExp = /[^ @]*@[^ @]*/;

    async createUser(data): Promise<UserModel> {
        const validUserError = this.isValidUserData(data);
        if (validUserError instanceof UserDataNotValidError) {
            throw validUserError;
        }
        const collection = await db.getUsers();

        data = Object.assign({}, data, {
            createdAt: new Date().getTime(),
            updatedAt: null,
            revokeId: new Date().getTime(),
            password: await this.encryptPassword(data.password)
        });

        const result = await collection.updateOne(
            { $or: [{ username: data.username }, { email: data.email }] },
            { $setOnInsert: data },
            { upsert: true }
        );

        if (result.modifiedCount || result.upsertedId === null) {
            throw new UserAlreadyExistError('User already exists');
        }
        return await this.find(result.upsertedId._id);
    }

    async updateUser(_id: string, data: UserData): Promise<UserModel> {
        return Promise.reject(null);
    }

    async revoke(_id: string): Promise<boolean> {
        if (!_id) {
            throw new Error('Invalid argument _id');
        }

        const collection = await db.getUsers();
        const result = await collection.updateOne(
            { _id },
            { $set: { revokeId: new Date().now() } },
            {}
        );

        if (result.modifiedCount !== 1) {
            throw new Error('User not found');
        }

        return true;
    }

    async find(_id: string): Promise<UserModel> {
        if (!_id) {
            throw null;
        }
        try {
            const collection = await db.getUsers();
            return await collection.findOne({ _id: ObjectId(_id) });
        } catch (err) {
            throw new FetchingUserError('Fetching user failed');
        }
    }

    async findUser(username: string): Promise<UserModel> {
        let where = { $or: [{ username }, { email: username }] };

        try {
            const collection = await db.getUsers();
            return await collection.findOne(where);
        } catch (err) {
            console.error(err);
            throw new Error('Fetching user failed');
        }

    }

    async deleteUser(_id: string): Promise<UserModel> {
        return Promise.reject(null);
    }

    encryptPassword(password: string): Promise<string> {
        return new Promise(
            (resolve, reject) => {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(password, salt);
                resolve(hash);
            }
        );
    }

    comparePassword(password: string, current: string): Promise<string> {
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

    isValidUserData(data: UserData): UserDataNotValidError {
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
