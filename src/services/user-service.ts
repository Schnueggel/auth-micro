
export interface UserStoreStrategy {
    createUser(data: IUserData): Promise<IUserModel>;
    updateUser(_id: string, data: IUserData);
    revoke(_id: string): Promise<boolean>;
    find(_id: string): Promise<IUserModel>;
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
    username?: string;
    password?: string;
}

export default class UserService {
    private strategy: UserStoreStrategy;

    constructor(strategy: UserStoreStrategy) {
        this.strategy = strategy;
    }

    async createUser(data: IUserData): Promise<IUserModel> {
        return await this.strategy.createUser(data);
    }

    async updateUser(_id: string, data: IUserData): Promise<IUserModel> {
        return await this.strategy.updateUser(_id, data);
    }

    async revoke(_id: string): Promise<boolean> {
        return await this.strategy.revoke(_id);
    }

    async find(_id: string): Promise<IUserModel> {
        return await this.strategy.find(_id);
    }

    async findUser(usernameOrEmail: string): Promise<IUserModel> {
        return await this.strategy.findUser(usernameOrEmail);
    }

    /**
     *
     * @param usernameOrEmail
     * @param password
     * @return {IUserModel}
     */
    async findUsernamePassword(usernameOrEmail: string, password: string): Promise<IUserModel> {
        return await this.strategy.findUsernamePassword(usernameOrEmail, password);
    }

    async deleteUser(_id: string): Promise<boolean> {
        return await this.strategy.deleteUser(_id);
    }
}
