const jwt = require('jsonwebtoken');
const NodeRsa = require('node-rsa');
const userModel = require('./user');

class Token {
    constructor() {
        this.rsa = new NodeRsa({b:2048});
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

            const userData = await userModel.find(tokenData.sub);

            if (!userData) {
                resolve(new Error('User not found'));
            } else if (userData instanceof Error) {
                resolve(userData);
            } else if (isNaN(tokenData.revokeId) || tokenData.revokeId !== userData.revokeId) {
                resolve(new Error('Invalid Revoke Id'));
            } else {
                resolve(true);
            }
        });
    }
}

module.exports = new Token();
