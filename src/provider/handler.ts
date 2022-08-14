import axios, { AxiosRequestConfig } from 'axios';
// import { EventRegister } from 'react-native-event-listeners';
// import { EVENT_API_UNAUTHORIZED } from '../constant';
// import { getEnvironment } from '../service/config';
// import { capture } from '../helper/error';
import { isActive } from '../helper/jwt';
import { AuthorizationError, AuthorizationErrorReason } from '../type/error/AuthorizationError';
import { UnexpectedError } from '../type/error/UnexpectedError';

export const ApiErrorHandler = (error: unknown, config?: AxiosRequestConfig) => {
    // capture(error, { log: true, alert: getEnvironment.apiAlert, sentry: false });
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
            // EventRegister.emit(EVENT_API_UNAUTHORIZED, 'Unauthorized');
            if (config?.headers?.Authorization && typeof config.headers.Authorization === 'string' && config.headers.Authorization.startsWith('Bearer ')) {
                const token = config.headers.Authorization.substring(7); // Remove `Bearer `
                const active = isActive(token);
                if (active !== undefined && !active) {
                    throw new AuthorizationError('Session Expired', AuthorizationErrorReason.Expired);
                }
            }
        }
        throw error;
    }

    throw new UnexpectedError('Unexpected Network Error');
};
