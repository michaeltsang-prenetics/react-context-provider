import jwt, { JwtPayload } from 'jwt-decode';
import moment from 'moment';

export enum Role {
    CustomerUser = 'customer_user',
    OtpVerified = 'otp_verified',
}

enum LoginType {
    Basic = 'basic',
    Mobile = 'mobile',
    WeChat = 'wechat',
    Email = 'email',
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

interface Token extends JwtPayload {
    ccs?: Array<Ccs>;
    roles?: Role[];
    uid?: string;
}

const capture = (e: unknown) => {
    if (e instanceof Error) {
        console.warn(`Invalid jwt: ${e.message}`);
    } else {
        console.warn(`Invalid jwt: ${e}`);
    }
};

export const getUserId = (input: string): string | undefined => {
    try {
        const decoded = jwt(input);
        const token = decoded as Token;
        return token.uid;
    } catch (error) {
        capture(error);
        return;
    }
};

export const getRoles = (input: string): Role[] | undefined => {
    try {
        const decoded = jwt(input);
        const token = decoded as Token;
        return token.roles;
    } catch (error) {
        capture(error);
        return;
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
        capture(error);
        return;
    }
};
