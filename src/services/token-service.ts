import * as jwt from 'jsonwebtoken';
import UserService from './user-service';

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

export default class TokenService {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    /**
     *
     * @param payload
     * @param privateKey
     * @param header
     * @return {Promise<T>}
     */
    createToken(payload: ITokenPayload, privateKey: string, header: ITokenHeader): Promise<string> {
        return new Promise(
            resolve => {
                // TODO error handling
                resolve(
                    jwt.sign(
                        payload, privateKey, {
                            algorithm: 'RS256',
                            expiresIn: '1d',
                            header
                        }
                    )
                );
            }
        );
    }

    decodeToken(token: string): ITokenData {
        return jwt.decode(token, {complete: true});
    }

    verifyToken(token: string, publicKey: string): Promise<boolean> {
        return new Promise(
            async(resolve, reject) => {
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
            }
        );
    }
}
