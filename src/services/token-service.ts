import * as jwt from 'jsonwebtoken';
import UserService from './user-service';
import { Algorithm } from 'jsonwebtoken';
import * as EnvUtils from '../utils/env-utils';

export interface ITokenPayload {
    sub: string;
    revokeId: number;
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

export interface IOptions {
    algorithm?: Algorithm;
    tokenExpire?: string;
    refreshExpire?: string;
}

export default class TokenService {
    private userService: UserService;
    private options: IOptions;

    constructor(userService: UserService, options?: IOptions) {
        this.userService = userService;
        this.setOptions(options);
    }

    public setOptions(options: IOptions) {
        this.options = Object.assign({
            algorithm: EnvUtils.getString('TOKEN_SERVICE_ALGORITHM', 'RS256'),
            tokenExpire: EnvUtils.getString('TOKEN_SERVICE_TOKEN_EXPIRE', '1d'),
            refreshExpire: EnvUtils.getString('TOKEN_SERVICE_REFRESH_EXPIRE', '30d'),
        }, options);
    }

    /**
     *
     * @param payload
     * @param privateKey
     * @param header
     * @return {Promise<string>}
     */
    createToken(payload: ITokenPayload, privateKey: string, header: ITokenHeader): Promise<string> {
        return new Promise(resolve => {
            // TODO error handling
            resolve(jwt.sign(payload, privateKey, {
                algorithm: this.options.algorithm,
                expiresIn: this.options.tokenExpire,
                header
            }));
        });
    }

    decodeToken(token: string): ITokenData {
        return jwt.decode(token, {complete: true});
    }

    createRefreshToken(payload: any, privateKey: string, header: ITokenHeader): Promise<string> {
        return new Promise(resolve => {
            // TODO error handling
            resolve(jwt.sign(payload, privateKey, {
                algorithm: this.options.algorithm,
                expiresIn: this.options.tokenExpire,
                header
            }));
        });
    }

    verifyToken(token: string, publicKey: string): Promise<boolean> {
        return new Promise(async(resolve, reject) => {
            // TODO error handling
            const tokenPayload = jwt.verify(token, publicKey) as ITokenPayload;

            if (tokenPayload instanceof Error) {
                return reject(tokenPayload);
            }

            const userData = await this.userService.find(tokenPayload.sub);

            if (!userData) {
                reject(new Error('User not found'));
            } else if (userData instanceof Error) {
                reject(userData);
            } else if (isNaN(tokenPayload.revokeId) || tokenPayload.revokeId !== userData.revokeId) {
                reject(new Error('Invalid Revoke Id'));
            } else {
                resolve(true);
            }
        });
    }
}
