import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '../AuthProvider';
import * as AuthService from '../../../service/api/authentication/authentication';
import { AuthenticationError, AuthenticationErrorReason } from '../../../type/error/AuthenticationError';
import { useAuth } from '../../..';

jest.mock('../../../service/api/authentication/authentication');

afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
});

describe('init', () => {
    test('with token successfully', async () => {
        // setup
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider token="AUTH_TOKEN">{children}</AuthProvider>,
        });

        // test
        await waitFor(() => expect(result.current.token).toBe('AUTH_TOKEN'));
    });
});

describe('login', () => {
    test('success', async () => {
        // setup
        (AuthService.postCreateToken as jest.Mock).mockReturnValue(Promise.resolve('AUTH_TOKEN'));
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // test
        expect(result.current.token).toBeUndefined();
        await act(async () => {
            expect(result.current.login('username', 'password')).resolves.toEqual('AUTH_TOKEN');
        });
        expect(result.current.token).toEqual('AUTH_TOKEN');
    });

    test('failure', async () => {
        // setup
        (AuthService.postCreateToken as jest.Mock).mockRejectedValue('AUTH_ERROR');
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // test
        expect(result.current.token).toBeUndefined();
        await act(async () => {
            await expect(result.current.login('username', 'password')).rejects.toEqual('AUTH_ERROR');
        });
        expect(result.current.token).toBeUndefined();
    });
});

describe('logout', () => {
    test('with no cached token', async () => {
        // setup
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // test
        expect(result.current.token).toBeUndefined();
        await act(async () => result.current.logout());
        expect(result.current.token).toBeUndefined();
    });

    test('with cached token', async () => {
        // setup
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider token="AUTH_TOKEN">{children}</AuthProvider>,
        });

        // test
        expect(result.current.token).toEqual('AUTH_TOKEN');
        await act(async () => result.current.logout());
        expect(result.current.token).toBeUndefined();
    });
});

describe('request OTP', () => {
    test('success', async () => {
        // setup
        (AuthService.postOtpRequest as jest.Mock).mockReturnValue(Promise.resolve('demo+circle@prenetics.com'));
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // test
        await act(async () => {
            await expect(result.current.requestOtp('demo+circle@prenetics.com', false)).resolves.toBe('demo+circle@prenetics.com');
        });
    });

    test('too many requests', async () => {
        // setup
        (AuthService.postOtpRequest as jest.Mock).mockRejectedValue({ isAxiosError: true, response: { status: 429 } });
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // test
        await act(async () => {
            await expect(result.current.requestOtp('demo+circle@prenetics.com', false)).rejects.toThrow(new AuthenticationError(AuthenticationErrorReason.TooMany));
        });
    });

    test('account does not exist', async () => {
        // setup
        (AuthService.postOtpRequest as jest.Mock).mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { error_message: 'asdf does not exist' } } });
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // test
        await act(async () => {
            await expect(result.current.requestOtp('demo+circle@prenetics.com', false)).rejects.toThrow(new AuthenticationError(AuthenticationErrorReason.NotExists));
        });
    });

    test('general error', async () => {
        // setup
        (AuthService.postOtpRequest as jest.Mock).mockRejectedValue(new Error());
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // test
        await act(async () => {
            await expect(result.current.requestOtp('demo+circle@prenetics.com', false)).rejects.toBeInstanceOf(AuthenticationError);
            await expect(result.current.requestOtp('demo+circle@prenetics.com', false)).rejects.toHaveProperty('reason', AuthenticationErrorReason.General);
        });
    });
});
