export class Exception {
    private error;

    constructor(message) {
        this.error = new Error(message);
        this.error.name = this.constructor.name;
    }

    get stack() {
        return this.error.stack;
    }

    set stack(stack) {
        this.error.stack = stack;
    }

    get name() {
        return this.error.name;
    }

    set name(name) {
        this.error.name = name;
    }

    get message() {
        return this.error.message;
    }

    set message(message) {
        this.error.message = message;
    }
}

Object.setPrototypeOf(Exception.prototype, Error.prototype);

export class UserDataNotValidError extends Exception {}
export class UserAlreadyExistError extends Exception {}
export class UserUpdatingError extends Exception {}
export class UserNotFoundError extends Exception {}
export class FetchingUserError extends Exception {}
