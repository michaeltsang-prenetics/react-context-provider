import React, { PropsWithChildren, useCallback, useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import * as AuthService from '../../service/api/authentication/authentication';
import * as CustomerService from '../../service/api/customer/customer';
import { ApiErrorHandler } from '../handler';
import * as JWT from '../../helper/jwt';
import { getRoles, Role } from '../../helper/jwt';
import axios from 'axios';
import { AuthenticationError, AuthenticationErrorReason } from '../../type/error/AuthenticationError';

type Props = {
    token?: string;
    locale?: string;
};

export const AuthProvider: React.FC<PropsWithChildren<Props>> = ({ children, token, locale = 'en-HK' }) => {
    const [authToken, setAuthToken] = useState<string | undefined>(token);

    const requestOtp = useCallback(
        async (email: string, verify: boolean) => {
            try {
                return await AuthService.postOtpRequest(
                    {
                        username: email,
                        type: 'email',
                        lang: locale,
                        verify,
                    },
                    ApiErrorHandler,
                );
            } catch (e) {
                if (axios.isAxiosError(e) && e.response?.status === 429) {
                    throw new AuthenticationError(AuthenticationErrorReason.TooMany);
                } else if (axios.isAxiosError(e) && e.response?.status === 400) {
                    const hasErrorMessage = (data: unknown): data is Object & { error_message: string } => {
                        if (data && typeof data === 'object') {
                            if ('error_message' in data) {
                                return true;
                            }
                        }

                        return false;
                    };

                    const errMsg = hasErrorMessage(e.response.data) && e.response.data.error_message;
                    if (errMsg && errMsg.match(/^.+does not exist$/)) {
                        throw new AuthenticationError(AuthenticationErrorReason.NotExists);
                    }
                }

                throw new AuthenticationError(AuthenticationErrorReason.General);
            }
        },
        [locale],
    );

    const verifyOtp = async (email: string, otp: string) => {
        return await AuthService.postOtpVerification(
            {
                username: email,
                password: otp,
                type: 'email',
            },
            ApiErrorHandler,
        );
    };

    const register = useCallback(
        async (email: string, password: string, token: string, location?: string) => {
            const roles = token ? getRoles(token) : undefined;
            if (token && roles) {
                if (roles.some(role => role === Role.CustomerUser)) {
                    throw new AuthenticationError(AuthenticationErrorReason.AlreadyExists);
                }
            } else {
                throw new Error('Cannot create account: Invalid OTP token');
            }

            const result = await CustomerService.postCreateAccount(
                {
                    username: email,
                    password: password,
                    nickname: email,
                    locale: locale,
                    location,
                },
                token,
                ApiErrorHandler,
            );

            setAuthToken(result.emailIdentity);
            return result.emailIdentity;
        },
        [locale],
    );

    const login = useCallback(async (username: string, password: string) => {
        const token = await AuthService.postCreateToken(
            {
                username: username,
                password: password,
                locale: 'en-HK',
            },
            ApiErrorHandler,
        );

        setAuthToken(token);
        return token;
    }, []);

    const logout = useCallback(async () => {
        setAuthToken(undefined);
    }, []);

    const updatePassword = useCallback(async (password: string, jwt: string) => {
        try {
            if (!jwt) throw new Error('Not Authorized');
            const uid = JWT.getUserId(jwt);
            if (!uid) throw new Error('Missing user ID');
            await AuthService.putUpdateUser(
                {
                    userid: uid,
                    info: { password },
                },
                jwt,
                ApiErrorHandler,
            );
        } catch (error) {
            // capture(error);
            return Promise.reject();
        }
    }, []);

    const authContext = React.useMemo(
        () => ({
            token: authToken,
            requestOtp,
            verifyOtp,
            register,
            login,
            logout,
            updatePassword,
        }),
        [authToken, login, logout, register, requestOtp, updatePassword],
    );

    return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
