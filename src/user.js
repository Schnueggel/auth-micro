const config = require('./config');
const bcrypt = require('bcrypt');
const db = require('./db');
const ObjectId = require('mongodb').ObjectId

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
            revokeId: new Date().getTime(),
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

    async revoke(_id) {
        if (!id) {
            return new Error('Invalid argument _id');
        }

        const collection = await db.getUsers();
        const result = await collection.updateOne(
            {_id},
            {$set: {revokeId: new Date().time}},
            {}
        );

        if (result.modifiedCount !== 1) {
            return new Error('User not found');
        }

        return true;
    }

    async find(_id) {
        if (!_id) {
            console.warn('Invalid user id');
            return new Error('Invalid argument _id');
        }
        try {
            const collection  = await db.getUsers();
            return await collection.findOne({_id: ObjectId(_id)});
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
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(password,salt);
                resolve(hash);
            }
        );
    }

    comparePassword(password, current) {
        return new Promise(
            (resolve, reject) => {
                const equal = bcrypt.compareSync(password, current);
                if (equal) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        );
    }

    isValidUserData(data) {
        if (typeof data !== 'object') {
            return new Error('Invalid User data');
        } else if (typeof data.password !== 'string' || data.password.length < config.PASSWORD_LENGTH) {
            return new Error('Invalid password. Minimum length ' + config.PASSWORD_LENGTH);
        } else if (data.password.length > 250) {
            return new Error('Invalid password. Maximum length 250');
        } else if(new RegExp(config.PASSWORD_REGEX).test(data.password) === false) {
            return new Error('Invalid password');
        } else if (config.ENABLE_USERNAME && (typeof data.username !== 'string' || data.username.length < 1 || data.username.indexOf('@') > -1)) {
            return new Error('Invalid username');
        } else if (!this.emailRegex.test(data.email)) {
            return new Error('Invalid email');
        }

        return true;
    }
}

module.exports = new User();
