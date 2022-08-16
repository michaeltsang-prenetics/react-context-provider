import React, { PropsWithChildren, useCallback, useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import * as AuthService from '../../service/api/authentication/authentication';
import * as CustomerService from '../../service/api/customer/customer';
import { ApiErrorHandler } from '../handler';
import * as JWT from '../../helper/jwt';
import { getRoles, Role } from '../../helper/jwt';
import axios from 'axios';
import { AuthenticationError, AuthenticationErrorReason } from '../../type/error/AuthenticationError';
import { PropsWithErrorCapturing } from '../../type/provider/Props';

type Props = {
    init?: { token: string };
    locale?: string;
};

export const AuthProvider: React.FC<PropsWithChildren<PropsWithErrorCapturing<Props>>> = ({ children, init, locale = 'en-HK', capturing }) => {
    const [authToken, setAuthToken] = useState<string | undefined>(init?.token);

    const capture = useCallback(
        (e: unknown) => {
            if (capturing) capturing(e);
        },
        [capturing],
    );

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
                capture(e);
                if (axios.isAxiosError(e)) {
                    const status = e.response?.status;
                    if (status === 429) {
                        throw new AuthenticationError(AuthenticationErrorReason.TooMany);
                    } else if (status === 400) {
                        const hasErrorMessage = (data: unknown): data is Object & { error_message: string } => {
                            if (data && typeof data === 'object') {
                                if ('error_message' in data) {
                                    return true;
                                }
                            }
                            return false;
                        };

                        const errMsg = hasErrorMessage(e.response?.data) && e.response?.data.error_message;
                        if (errMsg && errMsg.match(/^.+does not exist$/)) {
                            throw new AuthenticationError(AuthenticationErrorReason.NotExists);
                        }
                    }
                }

                throw new AuthenticationError(AuthenticationErrorReason.General);
            }
        },
        [capture, locale],
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
            const roles = getRoles(token);
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

    const updatePassword = useCallback(
        async (password: string, jwt: string) => {
            const uid = JWT.getUserId(jwt);
            if (!uid) {
                throw new Error('Missing user ID');
            }

            try {
                await AuthService.putUpdateUser(
                    {
                        userid: uid,
                        info: { password },
                    },
                    jwt,
                    ApiErrorHandler,
                );
            } catch (e) {
                capture(e);
                throw e;
            }
        },
        [capture],
    );

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
