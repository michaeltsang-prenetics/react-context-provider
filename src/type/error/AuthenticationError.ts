export enum AuthenticationErrorReason {
    TooMany = 'ERR_AUTH_TOO_MANY',
    NotExists = 'ERR_AUTH_NOT_EXISTS',
    AlreadyExists = 'ERR_AUTH_ALREADY_EXISTS',
    General = 'ERR_AUTH_GENERAL',
}
export class AuthenticationError extends Error {
    reason: AuthenticationErrorReason;

    constructor(r = AuthenticationErrorReason.General, m?: string) {
        super(m || r);
        this.name = 'AuthenticationError';
        this.reason = r;

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}
