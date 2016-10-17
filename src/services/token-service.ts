import * as jwt from 'jsonwebtoken';
import * as EnvUtils from '../utils/env-utils';
import { IUserModel } from './user-service';

export interface ITokenPayload {
    sub: string;
    revokeId: number;
    refresh?: boolean;
    iat?: number;
    exp?: number;
}

export interface ITokenHeader {
    sid: string;
}

export interface ITokenData {
    header: {
        sid: string;
        alg?: string;
        typ?: string;
    };
    payload: ITokenPayload;
}

export interface ITokens {
    token: string;
    refreshToken: string;
}

export interface IOptions {
    algorithm?: jwt.Algorithm;
    tokenExpire?: string;
    refreshExpire?: string;
}

export class TokenService {
    private options: IOptions;

    constructor(options?: IOptions) {
        this.setOptions(options);
    }

    public setOptions(options: IOptions): void {
        this.options = Object.assign({
            algorithm: EnvUtils.getString('TOKEN_SERVICE_ALGORITHM', 'RS256'),
            tokenExpire: EnvUtils.getString('TOKEN_SERVICE_TOKEN_EXPIRE', '1d'),
            refreshExpire: EnvUtils.getString('TOKEN_SERVICE_REFRESH_EXPIRE', '30d')
        }, options);
    }

    /**
     *
     * @param payload
     * @param privateKey
     * @param header
     * @return {Promise<string>}
     */
    public createToken(payload: ITokenPayload, privateKey: string, header: ITokenHeader): Promise<string> {
        return new Promise(resolve => {
            // TODO error handling
            resolve(jwt.sign(payload, privateKey, {
                algorithm: this.options.algorithm,
                expiresIn: this.options.tokenExpire,
                header
            }));
        });
    }

    public decodeToken(token: string): ITokenData {
        return jwt.decode(token, {complete: true});
    }

    public createRefreshToken(payload: Object, privateKey: string, header: ITokenHeader): Promise<string> {
        return new Promise(resolve => {
            // TODO error handling
            resolve(jwt.sign(payload, privateKey, {
                algorithm: this.options.algorithm,
                expiresIn: this.options.tokenExpire,
                header
            }));
        });
    }

    public async createTokenFromUser(user: IUserModel, privateKey: string, uuid: string): Promise<string> {
        return await this.createToken({
            sub: user._id,
            revokeId: user.revokeId
        }, privateKey, {
            sid: uuid
        });
    }

    public async createTokensFromUser(user: IUserModel, privateKey: string, uuid: string): Promise<ITokens> {
        const token = await this.createTokenFromUser(user, privateKey, uuid);

        const refreshToken = await this.createRefreshToken({
            sub: user._id,
            revokeId: user.revokeId,
            refresh: true
        }, privateKey, {
            sid: uuid
        });

        return {
            token,
            refreshToken
        };
    }

    /**
     * Verify token. Using the user data
     * @param token
     * @param publicKey
     * @return {Promise<ITokenPayload>}
     */
    public verifyToken(token: string, publicKey: string): Promise<ITokenPayload> {
        return new Promise(async(resolve, reject) => {
            try {
                const tokenPayload = jwt.verify(token, publicKey) as ITokenPayload;
                resolve(tokenPayload);
            } catch (err) {
                reject(err);
            }
        });
    }
}
