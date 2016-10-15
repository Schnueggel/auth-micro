
export interface UserStoreStrategy {
    createUser(data: UserData): Promise<UserModel>;
    updateUser(_id: string, data: UserData);
    revoke(_id: string): Promise<boolean>;
    find(_id: string): Promise<UserModel>;
    findUser(usernameOrEmail: string): Promise<UserModel>;
    findUsernamePassword(usernameOrEmail: string, password: string): Promise<UserModel>;
    deleteUser(_id: string): Promise<UserModel>;
}

export interface UserModel extends UserData {
    createdAt: number;
    updatedAt: number;
    revokeId: number;
}

export interface UserData {
    _id?: string;
    email: string;
    username?: string;
    password: string;
}

export default class UserService {
    private strategy: UserStoreStrategy;

    constructor(strategy: UserStoreStrategy) {
        this.strategy = strategy;
    }

    async createUser(data: UserData): Promise<UserModel> {
        return await this.strategy.createUser(data);
    }

    async updateUser(_id: string, data: UserData): Promise<UserModel> {
        return await this.strategy.updateUser(_id, data);
    }

    async revoke(_id: string): Promise<boolean> {
        return await this.strategy.revoke(_id);
    }

    async find(_id: string): Promise<UserModel> {
        return await this.strategy.find(_id);
    }

    async findUser(usernameOrEmail: string): Promise<UserModel> {
        return await this.strategy.findUser(usernameOrEmail);
    }

    /**
     *
     * @param usernameOrEmail
     * @param password
     * @return {UserModel}
     */
    async findUsernamePassword(usernameOrEmail: string, password: string): Promise<UserModel> {
        return await this.strategy.findUsernamePassword(usernameOrEmail, password);
    }

    async deleteUser(_id: string): Promise<UserModel> {
        return await this.strategy.deleteUser(_id);
    }
}
