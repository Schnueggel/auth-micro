/**
 * TODO Error docs
 */
export interface IUserStoreStrategy {
    createUser(data: IUserData): Promise<IUserModel>;
    /**
     * @throws UserNotFoundError
     * @throws UserUpdatingError
     */
    updateUser(_id: string, data: IUserData): Promise<IUserModel>;
    revoke(_id: string): Promise<boolean>;
    find(_id: string): Promise<IUserModel>;
    findFacebookUser(_id: string): Promise<IUserModel>;
    findUser(usernameOrEmail: string): Promise<IUserModel>;
    findUsernamePassword(usernameOrEmail: string, password: string): Promise<IUserModel>;
    deleteUser(_id: string): Promise<boolean>;
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
    facebookId?: string;
    username?: string;
    password?: string;
}

export const UserDataTypeMap = {
    email: String,
    username: String,
    password: String,
    isAdmin: Boolean
};

/**
 * TODO Error docs
 */
export class UserService implements IUserStoreStrategy {
    private strategy: IUserStoreStrategy;

    constructor(strategy: IUserStoreStrategy) {
        this.strategy = strategy;
    }

    public async createUser(data: IUserData): Promise<IUserModel> {
        data = this.ensureUserDataTypes(data);
        return await this.strategy.createUser(data);
    }

    /**
     * @throws UserNotFoundError
     * @throws UserUpdatingError
     */
    public async updateUser(_id: string, data: IUserData): Promise<IUserModel> {
        data = this.ensureUserDataTypes(data);
        return await this.strategy.updateUser(_id, data);
    }

    public async revoke(_id: string): Promise<boolean> {
        return await this.strategy.revoke(_id);
    }

    public async find(_id: string): Promise<IUserModel> {
        return await this.strategy.find(_id);
    }

    public async findFacebookUser(_id: string): Promise<IUserModel> {
        return await this.strategy.findFacebookUser(_id);
    }

    public async findUser(usernameOrEmail: string): Promise<IUserModel> {
        return await this.strategy.findUser(usernameOrEmail);
    }

    /**
     *
     */
    public async findUsernamePassword(usernameOrEmail: string, password: string): Promise<IUserModel> {
        return await this.strategy.findUsernamePassword(usernameOrEmail, password);
    }

    public async deleteUser(_id: string): Promise<boolean> {
        return await this.strategy.deleteUser(_id);
    }

    private ensureUserDataTypes(data: IUserData): IUserData {
        Object.keys(data).forEach(key => {
            if (UserDataTypeMap[key]) {
                data[key] = UserDataTypeMap[key](data[key]);
            }
        });

        return data;
    }
}
