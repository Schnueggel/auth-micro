const rp = require('request-promise');
import { InvalidArgumentError } from '../errors';

/**
 * TODO Error docs
 */
export interface IUserStoreStrategy extends IUserService {
}

export interface IUserService {
    find(_id: string): Promise<IUserModel>;
    findUser(usernameOrEmail: string): Promise<IUserModel>;
    findUsernamePassword(usernameOrEmail: string, password: string): Promise<IUserModel>;
}

export interface IUserModel extends IUserData {
    createdAt: number;
    deletedAt: number;
    updatedAt: number;
    revokeId: number;
}

export interface IUserData {
    _id?: string;
    email?: string;
    deleted?: boolean;
    disabled?: boolean;
    isAdmin?: boolean;
    username?: string;
}

export interface Options {
    getUserUrl: string;
    findUserUrl: string;
}
/**
 * TODO Error docs
 */
export class UserService implements IUserService {
    private options: Options;

    constructor(options: Options) {
        this.options = options;
        if (!options.getUserUrl) {
            throw new InvalidArgumentError('expect option param "getUserUrl"');
        }

        if (!options.findUserUrl) {
            throw new InvalidArgumentError('expect option param "findUserUrl"');
        }
    }

    public find(id: string): Promise<IUserModel> {
        const uri = this.createUserUrl(id);
        return rp({
            uri,
            json: true,
        }).then((res: Response) => {
            return res.body;
        });
    }

    /**
     * TODO perhaps we don't need this
     * @param usernameOrEmail
     */
    public findUser(usernameOrEmail: string): Promise<IUserModel> {
        return rp({
            uri: this.options.findUserUrl,
            method: 'POST',
            json: true,
            body: {
                username: usernameOrEmail,
            },
        }).then((res: Response) => {
            return res.body;
        });
    }

    /**
     * TODO error handling
     */
    public findUsernamePassword(usernameOrEmail: string, password: string): Promise<IUserModel> {
        return rp({
            uri: this.options.findUserUrl,
            method: 'POST',
            json: true,
            body: {
                username: usernameOrEmail,
                password,
            },
        }).then((res: Response) => {
            return res.body;
        });
    }

    public createUserUrl(id: string): string {
        return this.options.getUserUrl.replace(':id', id);
    }
}
