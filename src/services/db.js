const config = require('./../config');
const MongoClient = require('mongodb').MongoClient;

class Db {
    async getDb() {
        if (this.db) {
            return this.db;
        }
        return this.db = await this.createDb(config.MONGO_URL);
    }

    setDb(db) {
        this.db = db;
    }

    async createDb(url) {
        const db = await MongoClient.connect('mongodb://' + url);
        db.collection('users').createIndex({email:1}, {unique: true});
        db.collection('users').createIndex({username:1}, {unique: true});
        return db;
    }

    async getUsers() {
        const db = await this.getDb();
        return db.collection('users');
    }

    async clearCollection(name) {
        const db = await this.getDb();
        await db.collection(name).drop();
    }

    async clearCollectionUser() {
        return await this.clearCollection('users');
    }
}

module.exports = Db;
