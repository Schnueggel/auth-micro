import { Db, Collection } from 'mongodb';
import config from './../../config';
import * as mongodb from 'mongodb';

class MongoDb {
    private db: Db;

    async getDb(): Promise<Db> {
        if (this.db) {
            return this.db;
        }
        return this.db = await this.createDb(config.MONGO_URL);
    }

    setDb(db: Db): void {
        this.db = db;
    }

    async createDb(url: string): Promise<Db> {
        const db = await mongodb.MongoClient.connect('mongodb://' + url);
        db.collection('users').createIndex({email: 1}, {unique: true});
        db.collection('users').createIndex({username: 1}, {unique: true});
        return db;
    }

    async getUsers(): Promise<Collection> {
        const db = await this.getDb();
        return db.collection('users');
    }

    async clearCollection(name: string): Promise<any> {
        const db = await this.getDb();
        return await db.collection(name).drop();
    }

    async clearCollectionUser(): Promise<any> {
        return await this.clearCollection('users');
    }
}

export default MongoDb;
