const jwt = require('jsonwebtoken');
const NodeRsa = require('node-rsa');

class Token {
    constructor(userService) {
        this.rsa = new NodeRsa({b:2048});
        this.userService = userService;
    }

    createToken(userData) {
        return new Promise((resolve) => {
            // TODO error handling
            resolve(jwt.sign({revokeId: userData.revokeId, sub: userData._id}, this.rsa.exportKey(), {
                algorithm: 'RS256',
                expiresIn: '1d',
                header: {
                    sid: 123
                }
            }));
        });
    }

    verifyToken(token) {
        return new Promise(async (resolve, reject) => {
            // TODO error handling
            const tokenData = jwt.verify(token, this.rsa.exportKey('public'));

            if (tokenData instanceof Error) {
                return reject(tokenData);
            }

            const userData = await this.userService.find(tokenData.sub);

            if (!userData) {
                reject(new Error('User not found'));
            } else if (userData instanceof Error) {
                reject(userData);
            } else if (isNaN(tokenData.revokeId) || tokenData.revokeId !== userData.revokeId) {
                reject(new Error('Invalid Revoke Id'));
            } else {
                resolve(true);
            }
        });
    }
}

module.exports = Token;
