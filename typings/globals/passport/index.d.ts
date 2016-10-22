// Generated by typings
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/fd96cd48ae48fbd421612e50b33378808a37d2ce/passport/passport.d.ts
declare namespace Express {
    export interface Request {
        authInfo?: any;
        user?: any;

        // These declarations are merged into express's Request type
        login(user: any, done: (err: any) => void): void;
        login(user: any, options: Object, done: (err: any) => void): void;
        logIn(user: any, done: (err: any) => void): void;
        logIn(user: any, options: Object, done: (err: any) => void): void;

        logout(): void;
        logOut(): void;

        isAuthenticated(): boolean;
        isUnauthenticated(): boolean;
    }
}

declare module 'passport' {
    import express = require('express');

    export interface Passport {
        new ();
        use(strategy: Strategy): Passport;
        use(name: string, strategy: Strategy): Passport;
        unuse(name: string): Passport;
        framework(fw: Framework): Passport;
        initialize(options?: { userProperty: string; }): express.Handler;
        session(options?: { pauseStream: boolean; }): express.Handler;

        authenticate(strategy: string, callback?: Function): express.Handler;
        authenticate(strategy: string, options: Object, callback?: Function): express.Handler;
        authenticate(strategies: string[], callback?: Function): express.Handler;
        authenticate(strategies: string[], options: Object, callback?: Function): express.Handler;
        authorize(strategy: string, callback?: Function): express.Handler;
        authorize(strategy: string, options: Object, callback?: Function): express.Handler;
        authorize(strategies: string[], callback?: Function): express.Handler;
        authorize(strategies: string[], options: Object, callback?: Function): express.Handler;
        serializeUser(fn: (user: any, done: (err: any, id: any) => void) => void): void;
        deserializeUser(fn: (id: any, done: (err: any, user: any) => void) => void): void;
        transformAuthInfo(fn: (info: any, done: (err: any, info: any) => void) => void): void;
    }

    export interface Strategy {
        name?: string;
        authenticate(req: express.Request, options?: Object): void;
    }

    export interface Profile {
        provider: string;
        id: string;
        displayName: string;
        username?: string;
        name?: {
            familyName: string;
            givenName: string;
            middleName?: string;
        };
        emails?: {
            value: string;
            type?: string;
        }[];
        photos?: {
            value: string;
        }[];
    }

    export interface Framework {
        initialize(passport: Passport, options?: Object): Function;
        authenticate(passport: Passport, name: string, options?: Object, callback?: Function): Function;
        authorize?(passport: Passport, name: string, options?: Object, callback?: Function): Function;
    }
}