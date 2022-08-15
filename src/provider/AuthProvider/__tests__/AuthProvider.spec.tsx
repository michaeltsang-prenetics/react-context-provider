import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '../AuthProvider';
import * as AuthService from '../../../service/api/authentication/authentication';
import * as CustomerService from '../../../service/api/customer/customer';
import { AuthenticationError, AuthenticationErrorReason } from '../../../type/error/AuthenticationError';
import { useAuth } from '../../..';
import jwt from 'jsonwebtoken';
import { Role } from '../../../helper/jwt';
import { AxiosError } from 'axios';

jest.mock('../../../service/api/authentication/authentication');
jest.mock('../../../service/api/customer/customer');

afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
});

describe('init', () => {
    test('with token successfully', async () => {
        // Arrange
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider token="AUTH_TOKEN">{children}</AuthProvider>,
        });

        // Act + Assert
        await waitFor(() => expect(result.current.token).toBe('AUTH_TOKEN'));
    });
});

describe('@login', () => {
    test('success', async () => {
        // Arrange
        (AuthService.postCreateToken as jest.Mock).mockReturnValue(Promise.resolve('AUTH_TOKEN'));
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act
        expect(result.current.token).toBeUndefined();
        await act(async () => {
            expect(result.current.login('username', 'password')).resolves.toEqual('AUTH_TOKEN');
        });

        // Assert
        expect(result.current.token).toEqual('AUTH_TOKEN');
    });

    test('failure', async () => {
        // Arrange
        (AuthService.postCreateToken as jest.Mock).mockRejectedValue('AUTH_ERROR');
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act
        expect(result.current.token).toBeUndefined();
        await act(async () => {
            await expect(result.current.login('username', 'password')).rejects.toEqual('AUTH_ERROR');
        });

        // Assert
        expect(result.current.token).toBeUndefined();
    });
});

describe('@logout', () => {
    test('with no cached token', async () => {
        // Arrange
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act
        expect(result.current.token).toBeUndefined();
        await act(async () => result.current.logout());

        // Assert
        expect(result.current.token).toBeUndefined();
    });

    test('with cached token', async () => {
        // Arrange
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider token="AUTH_TOKEN">{children}</AuthProvider>,
        });

        // Act
        expect(result.current.token).toEqual('AUTH_TOKEN');
        await act(async () => result.current.logout());

        // Assert
        expect(result.current.token).toBeUndefined();
    });
});

describe('@requestOtp', () => {
    test('success', async () => {
        // Arrange
        (AuthService.postOtpRequest as jest.Mock).mockReturnValue(Promise.resolve('demo+circle@prenetics.com'));
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.requestOtp('demo+circle@prenetics.com', false)).resolves.toBe('demo+circle@prenetics.com');
        });
    });

    test('too many requests', async () => {
        // Arrange
        (AuthService.postOtpRequest as jest.Mock).mockRejectedValue({ isAxiosError: true, response: { status: 429 } });
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.requestOtp('demo+circle@prenetics.com', false)).rejects.toThrow(new AuthenticationError(AuthenticationErrorReason.TooMany));
        });
    });

    test('account does not exist', async () => {
        // Arrange
        (AuthService.postOtpRequest as jest.Mock).mockRejectedValue({ isAxiosError: true, response: { status: 400, data: { error_message: 'asdf does not exist' } } });
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.requestOtp('demo+circle@prenetics.com', false)).rejects.toThrow(new AuthenticationError(AuthenticationErrorReason.NotExists));
        });
    });

    test('general error', async () => {
        // Arrange
        (AuthService.postOtpRequest as jest.Mock).mockRejectedValue(new Error());
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.requestOtp('demo+circle@prenetics.com', false)).rejects.toThrow(new AuthenticationError(AuthenticationErrorReason.General));
        });
    });
});

describe('@verifyOtp', () => {
    test('success', async () => {
        // Arrange
        (AuthService.postOtpVerification as jest.Mock).mockResolvedValue('demo+circle@prenetics.com');
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.verifyOtp('demo+circle@prenetics.com', '0810')).resolves.toBe('demo+circle@prenetics.com');
        });
    });

    test('rejection', async () => {
        // Arrange
        (AuthService.postOtpVerification as jest.Mock).mockRejectedValue('ERROR');
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.verifyOtp('demo+circle@prenetics.com', '0810')).rejects.toEqual('ERROR');
        });
    });
});

describe('@regiser', () => {
    test('create account successfully', async () => {
        // Arrange
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
                roles: [Role.OtpVerified],
            },
            'secret',
        );
        (CustomerService.postCreateAccount as jest.Mock).mockResolvedValue({
            customerId: '9fb0c8a6-7f4b-47e0-b2a0-a2f1a7fd7c6a',
            profileId: '44453295-8dc6-42fb-bddb-e691519fd73c',
            emailIdentity: 'AUTH_TOKEN',
        });
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });
        expect(result.current.token).toBeUndefined();

        // Act
        await act(async () => {
            await expect(result.current.register('demo+circle@prenetics.com', '12345678', token)).resolves.toEqual('AUTH_TOKEN');
        });
        expect(result.current.token).toEqual('AUTH_TOKEN');
    });

    test('rejection', async () => {
        // Arrange
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
                roles: [Role.OtpVerified],
            },
            'secret',
        );
        (CustomerService.postCreateAccount as jest.Mock).mockRejectedValue('ERROR');
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.register('demo+circle@prenetics.com', '12345678', token)).rejects.toEqual('ERROR');
        });
    });

    test('account already exists', async () => {
        // Arrange
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
                roles: [Role.CustomerUser],
            },
            'secret',
        );
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.register('demo+circle@prenetics.com', '12345678', token)).rejects.toThrow(new AuthenticationError(AuthenticationErrorReason.AlreadyExists));
        });
    });

    test('token without roles should throw', async () => {
        // Arrange
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
            },
            'secret',
        );
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.register('demo+circle@prenetics.com', '12345678', token)).rejects.toThrow(new Error('Cannot create account: Invalid OTP token'));
        });
    });

    test('invalid token should throw', async () => {
        // Arrange
        const token = ' ';
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.register('demo+circle@prenetics.com', '12345678', token)).rejects.toThrow(new Error('Cannot create account: Invalid OTP token'));
        });
    });
});

describe('@updatePassword', () => {
    test('successfully', async () => {
        // Arrange
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
                uid: 'd29862ba-3e04-4326-8fc0-7c7a52840759',
            },
            'secret',
        );
        (AuthService.putUpdateUser as jest.Mock).mockResolvedValue(undefined);
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.updatePassword('demo+circle@prenetics.com', token)).resolves.not.toThrow();
        });
    });

    test('token without uid should throw', async () => {
        // Arrange
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
            },
            'secret',
        );
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.updatePassword('demo+circle@prenetics.com', token)).rejects.toThrow(new Error('Missing user ID'));
        });
    });

    test('token without uid should throw', async () => {
        // Arrange
        const token = jwt.sign(
            {
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
                uid: 'd29862ba-3e04-4326-8fc0-7c7a52840759',
            },
            'secret',
        );
        (AuthService.putUpdateUser as jest.Mock).mockRejectedValue(new AxiosError('Bad Request', '400'));
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
        });

        // Act + Assert
        await act(async () => {
            await expect(result.current.updatePassword('demo+circle@prenetics.com', token)).rejects.toThrow(AxiosError);
        });
    });
});
