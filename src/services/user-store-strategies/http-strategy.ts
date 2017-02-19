import { IUserStoreStrategy, IUserModel, IUserData } from '../user-service';
import * as bcrypt from 'bcrypt';
import { ObjectID } from 'mongodb';
import { UserDataNotValidError,
    UserAlreadyExistError,
    FetchingUserError,
    UserUpdatingError,
    UserNotFoundError } from '../../errors';
import * as request from 'request-promise';
import * as EnvUtils from '../../utils/env-utils';
import { FindOneAndReplaceOption } from 'mongodb';
import { IHash } from '../../types';

export interface IOptions extends IHash {
    url?: string;
    usernameRegex?: RegExp;
    enableUsername?: boolean;
    emailRegex?: RegExp;
    passwordRegex?: RegExp;
}

export class HttpStrategy implements IUserStoreStrategy {
    private options: IOptions;

    constructor(options?: IOptions) {
        this.setOptions(options);
        console.log('Using http api url:' + this.options.url);
    }

    public setOptions(options: IOptions) {
        // TODO RegExp should go into service
        this.options = Object.assign({
            emailRegex: EnvUtils.getRegExp('US_MONGO_STRATEGY_EMAIL_REGEX', /[^ @]*@[^ @]*/),
            usernameRegex: EnvUtils.getRegExp('US_MONGO_STRATEGY_USERNAME_REGEX', /^[a-zA-Z][0-9a-zA-Z]{1,20}$/),
            passwordRegex: EnvUtils.getRegExp('US_MONGO_STRATEGY_PASSWORD_REGEX', /^.{8,250}$/),
            url: EnvUtils.getString('US_MONGO_STRATEGY_URL', 'localhost:27017/auth-micro'),
            enableUsername: EnvUtils.getBoolean('US_MONGO_STRATEGY_ENABLE_USERNAME', true),
        }, options);
    }

    public async createUser(data: IUserData): Promise<IUserModel> {
        const validUserError = this.isValidUserData(data);
        if (validUserError instanceof UserDataNotValidError) {
            throw validUserError;
        }

        data = Object.assign(
            {
                isAdmin: false,
                deleted: false,
                disabled: false
            }, data, {
                createdAt: new Date().getTime(),
                updatedAt: null,
                deletedAt: null,
                revokeId: new Date().getTime(),
                password: await this.encryptPassword(data.password)
            }
        );

        let response;
        try {
            response = await request({
                method: 'POST',
                simple: true,
                resolveWithFullResponse: true,
                uri: this.options.url + '/user',
                body: data,
                headers: {
                    accept: 'application/json'
                },
                json: true
            });
        } catch (error) {
            throw new Error('Unexpected server error. User creation failed');
        }

        if (response.statusCode === 200) {
            return response.body;
        } else if (response.statusCode === 409) {
            throw new UserAlreadyExistError('User already exists');
        } else {
            console.error(response);
            throw Error('Creating user failed to unkown reasons');
        }
    }

    public async updateUser(id: string, data: IUserData): Promise<IUserModel> {
        data = Object.assign({}, data, {updatedAt: new Date().getTime()});

        const isValid = this.isValidUserData(data, true);

        if (isValid instanceof Error) {
            throw isValid;
        }

        if (data.password) {
            data.password = await this.encryptPassword(data.password);
        }

        if (data.deleted) {
            data = Object.assign(data, {deletedAt: new Date().getTime()});
        }

        let response;
        try {
            response = await request({
                method: 'PUT',
                simple: true,
                resolveWithFullResponse: true,
                uri: this.options.url + '/user',
                body: data,
                headers: {
                    accept: 'application/json'
                },
                json: true
            });
        } catch (error) {
            throw new Error('Unexpected server error. User creation failed');
        }

        if (response.statusCode === 200) {
            return response.body;
        } else if (response.statusCode === 404) {
            throw new UserNotFoundError('User not found');
        } else {
            console.error(response);
            throw Error('Creating user failed to unkown reasons');
        }
    }

    public async revoke(_id: string): Promise<boolean> {
        if (!_id) {
            throw new Error('Invalid argument _id');
        }

        let response;
        try {
            response = await request({
                method: 'PUT',
                simple: true,
                resolveWithFullResponse: true,
                uri: this.options.url + '/revoke/' + _id,
                headers: {
                    accept: 'application/json'
                },
                json: true,
            });
        } catch (error) {
            throw new Error('Unexpected server error. User creation failed');
        }

        if (response.statusCode === 200) {
            return true;
        } else if (response.statusCode === 404) {
            throw new UserNotFoundError('User not found');
        } else {
            console.error(response);
            throw Error('Creating user failed to unkown reasons');
        }
    }

    public async find(_id: string | ObjectID): Promise<IUserModel> {
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

    public async findFacebookUser(_id: string | ObjectID): Promise<IUserModel> {
        if (!_id) {
            throw null;
        }

        try {
            const collection = await this.db.getUsers();
            return await collection.find({facebookId: _id}).limit(1).next().then(result => result);
        } catch (err) {
            throw new FetchingUserError('Fetching user failed');
        }
    }

    public async findUser(username: string): Promise<IUserModel> {
        let where = {$or: [{username}, {email: username}]};

        try {
            const collection = await this.db.getUsers();
            return await collection.find(where).limit(1).next().then(result => result);
        } catch (err) {
            console.error(err);
            throw new Error('Fetching user failed');
        }

    }

    public async findUsernamePassword(username: string, password: string): Promise<IUserModel> {
        let where = {$or: [{username}, {email: username}]};

        try {
            const collection = await this.db.getUsers();
            const user: IUserModel = await collection.find(where).limit(1).next().then(result => result);

            if (!user || !await this.comparePassword(password, user.password)) {
                return null;
            }
            return user;
        } catch (err) {
            console.error(err);
            throw new Error('Fetching user failed');
        }
    }

    public async deleteUser(_id: string): Promise<boolean> {
        const collection = await this.db.getUsers();
        const result = await collection.deleteOne({_id: new ObjectID(_id)});
        return !!(result && result.deletedCount);
    }

    public encryptPassword(password: string): Promise<string> {
        return new Promise((resolve) => {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            resolve(hash);
        });
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

    public isValidUserData(data: IUserData, forUpdate: boolean = false): UserDataNotValidError {
        if (typeof data !== 'object') {
            return new UserDataNotValidError('Invalid User data');
        } else if (((forUpdate && data.password) || !forUpdate) && !this.options.passwordRegex.test(data.password)) {
            return new UserDataNotValidError('Invalid password');
        } else if (this.options.enableUsername && ((forUpdate && data.username) || !forUpdate) && this.options.usernameRegex.test(data.username) === false) {
            return new UserDataNotValidError('Invalid username');
        } else if (((forUpdate && data.email) || !forUpdate) && !this.options.emailRegex.test(data.email)) {
            return new UserDataNotValidError('Invalid email');
        }

        return null;
    }
}
