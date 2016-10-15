import { Db, Collection } from 'mongodb';
import * as mongodb from 'mongodb';

export interface IOptions {
    url: string;
}

export default class MongoDb {
    private db: Db;
    private options: IOptions;

    constructor(options?: IOptions) {
        this.options = options;
    }

    async getDb(): Promise<Db> {
        if (this.db) {
            return this.db;
        }
        return this.db = await this.createDb(this.options.url);
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
