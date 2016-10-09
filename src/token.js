const jwt = require('jsonwebtoken');
const NodeRsa = require('node-rsa');

class Token {
    constructor() {
        this.rsa = new NodeRsa({b:2048});
    }

    createToken(userId) {
        return new Promise((resolve) => {
            // TODO error handling
            resolve(jwt.sign({}, this.rsa.exportKey(), {
                algorithm: 'RS256',
                expiresIn: '1d',
                subject: userId,
                header: {
                    sid: 123
                }
            }));
        });
    }

    verifyToken(token) {
        return new Promise((resolve) => {
            // TODO error handling
            resolve(jwt.verify(token, this.rsa.exportKey('public')));
        });
    }
}

module.exports = new Token();
