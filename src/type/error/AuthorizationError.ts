export enum AuthorizationErrorReason {
    Expired = 'ERR_EXPIRED',
}
export class AuthorizationError extends Error {
    reason: AuthorizationErrorReason;

    constructor(m: string, r = AuthorizationErrorReason.Expired) {
        super(m);
        this.name = 'AuthorizationError';
        this.reason = r;

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, AuthorizationError.prototype);
    }
}
