import jwt, { JwtPayload } from 'jwt-decode';
import moment from 'moment';
import { Moment } from 'moment';
import { LoginType } from '../service/type/Customer';
// import { capture } from './error';

export enum Role {
    CustomerUser = 'customer_user',
    OtpVerified = 'otp_verified',
}

type Ccs =
    | {
          customerId: string;
          type: 'metadata';
      }
    | {
          countrycode: string;
          loginType: LoginType;
          type: 'identity';
          username: string;
      };

type Token = {
    ccs: Array<Ccs>;
    exp: Moment;
    iat: Moment;
    nbf: Moment;
    roles: Role[];
    sub: string;
    uid: string;
};

export const getCustomerId = (input: string): string | undefined => {
    try {
        const decoded = jwt(input);
        const token = decoded as Token;
        if (token.roles && token.roles.find(role => role === Role.CustomerUser)) {
            const ccs = token.ccs[0] as Ccs;
            if (ccs.type === 'metadata') {
                return ccs.customerId;
            }
        }
    } catch (error) {
        // capture(new Error(`Error getting customer ID from token: ${error}`));
    }
};

export const getUserId = (input: string): string | undefined => {
    try {
        const decoded = jwt(input);
        const token = decoded as Token;
        if (token.uid) return token.uid;
    } catch (error) {
        // capture(new Error(`Error getting user ID from token: ${error}`));
    }
};

export const getRoles = (input: string): Role[] | undefined => {
    try {
        const decoded = jwt(input);
        const token = decoded as Token;
        const role = token.roles && token.roles;
        return role;
    } catch (error) {
        // capture(new Error(`Error getting role from token: ${error}`));
    }
};

export const isActive = (input: string): boolean | undefined => {
    try {
        const decoded = jwt<JwtPayload>(input);

        if (decoded.exp === undefined) return undefined;

        const now = moment();
        // https://www.rfc-editor.org/rfc/rfc7519#section-2
        // jwt exp is defined as the number of seconds (not milliseconds) since Epoch
        const exp = moment(decoded.exp * 1000);
        if (!moment(exp).isAfter(now)) return false;
        return true;
    } catch (error) {
        // capture(error);
    }
};
