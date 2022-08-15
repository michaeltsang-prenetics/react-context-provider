import axios from 'axios';
import { isActive } from '../helper/jwt';
import { AuthorizationError, AuthorizationErrorReason } from '../type/error/AuthorizationError';
import { UnexpectedError } from '../type/error/UnexpectedError';

export const ApiErrorHandler = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
            if (error.config?.headers?.Authorization && typeof error.config.headers.Authorization === 'string' && error.config.headers.Authorization.startsWith('Bearer ')) {
                const token = error.config.headers.Authorization.substring(7); // Remove `Bearer `
                const active = isActive(token);
                if (active !== undefined && !active) {
                    throw new AuthorizationError('Session Expired', AuthorizationErrorReason.Expired);
                }
            }
        }
        throw error;
    }

    throw new UnexpectedError('Unexpected API Error');
};
