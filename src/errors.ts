export class Exception {
    private error: any;

    constructor(message: string) {
        this.error = new Error(message);
        this.error.name = this.constructor.name;
    }

    get stack(): string {
        return this.error.stack;
    }

    set stack(stack: string) {
        this.error.stack = stack;
    }

    get name(): string {
        return this.error.name;
    }

    set name(name: string) {
        this.error.name = name;
    }

    get message(): string {
        return this.error.message;
    }

    set message(message: string) {
        this.error.message = message;
    }
}

Object.setPrototypeOf(Exception.prototype, Error.prototype);

export class UserDataNotValidError extends Exception {}
export class UserAlreadyExistError extends Exception {}
export class UserUpdatingError extends Exception {}
export class UserNotFoundError extends Exception {}
export class InvalidArgumentError extends Exception {}
export class FetchingUserError extends Exception {}
