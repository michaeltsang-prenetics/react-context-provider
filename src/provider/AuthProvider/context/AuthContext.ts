import React from 'react';

export type AuthContextType = {
    token: string | undefined;
    requestOtp: (email: string, verify: boolean) => Promise<string>;
    verifyOtp: (email: string, otp: string) => Promise<string>;
    register: (email: string, password: string, token: string, location?: string) => Promise<string>;
    login: (email: string, password: string) => Promise<string>;
    logout: () => Promise<void>;
    updatePassword: (passowrd: string, token: string) => Promise<void>;
};

export const AuthContext = React.createContext<AuthContextType>({
    token: undefined,
    requestOtp: () => {
        return Promise.resolve('');
    },
    verifyOtp: () => {
        return Promise.resolve('');
    },
    register: () => {
        return Promise.resolve('');
    },
    login: () => {
        return Promise.resolve('');
    },
    logout: () => {
        return Promise.resolve();
    },
    updatePassword: () => {
        return Promise.resolve();
    },
});
