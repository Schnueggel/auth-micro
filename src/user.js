const config = require('./config');
const bcrypt = require('bcrypt');
const db = require('./db');

class User {
    constructor() {
        this.emailRegex = /[^ @]*@[^ @]*/;
    }

    async createUser(data) {
        const validUserError = this.isValidUserData(data);
        if (validUserError instanceof Error) {
            return validUserError;
        }
        const collection = await db.getUsers();

        data = Object.assign({}, data, {
            createdAt: new Date().getTime(),
            password: await this.encryptPassword(data.password)
        });

        try {
            const result = await collection.updateOne(
                {$or: [{username: data.username}, {email: data.email}]},
                {$setOnInsert: data},
                {upsert: true}
            );

            if (result.modifiedCount || result.upsertedId === null) {
                return new Error('User already exists');
            }
            return await this.find(result.upsertedId._id);
        } catch (err) {
            console.error(err);
            return new Error('Creating user failed');
        }
    }

    async find(_id) {
        if (!_id) {
            console.warn('Invalid user id');
            return null;
        }
        try {
            return await (await db.getUsers()).findOne({_id});
        } catch(err) {
            console.error(err);
            return new Error('Fetching user failed', 108);
        }
    }

    async findUser(username) {
        let where = {$or: [{username}, {email: username}]};

        try {
            const collection = await db.getUsers();
            const userData = await collection.findOne(where);

            return userData;
        } catch (err) {
            console.error(err);
            return new Error('Fetching user failed', 108);
        }

    }

    encryptPassword(password) {
        return new Promise(
            (resolve, reject) => {
                bcrypt.genSalt(
                    10, function (err, salt) {
                        bcrypt.hash(
                            password, salt, function (err, hash) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(hash);
                                }
                            }
                        );
                    }
                );
            }
        );
    }

    comparePassword(password, current) {
        return new Promise(
            (resolve, reject) => {
                bcrypt.compare(
                    password, current, function (err, res) {
                        if (res) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }
                );
            }
        );
    }

    isValidUserData(data) {
        if (typeof data !== 'object') {
            return new Error('Invalid User data');
        } else if (typeof data.password !== 'string' || data.password.length < config.PASSWORD_LENGTH) {
            return new Error('Invalid password. Minimum length ' + config.PASSWORD_LENGTH);
        } else if (data.password.length > 250) {
            return new Error('Invalid password. Maximum length 250', 103);
        } else if (config.ENABLE_USERNAME && (typeof data.username !== 'string' || data.username.length < 1 || data.username.indexOf('@') > -1)) {
            return new Error('Invalid username', 104);
        } else if (!this.emailRegex.test(data.email)) {
            return new Error('Invalid email', 105);
        }

        return true;
    }
}

module.exports = new User();
