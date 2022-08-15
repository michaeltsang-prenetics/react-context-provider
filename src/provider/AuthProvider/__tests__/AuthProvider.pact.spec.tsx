import path from 'path';
import { PactV3 } from '@pact-foundation/pact';
import { email, term } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import { AuthProvider, useAuth } from '../AuthProvider';
import { act, renderHook } from '@testing-library/react';
import { ValidationRegex } from '../../../helper/regex';
import { AuthenticationError, AuthenticationErrorReason } from '../../../type/error/AuthenticationError';

const provider = new PactV3({
    consumer: 'reactcontextprovider',
    provider: 'authentication',
    logLevel: 'warn',
    dir: path.resolve(process.cwd(), '.pact'),
});

describe('auth Pact test', () => {
    describe('login', () => {
        test('success', () => {
            // Arrange: Setup our expected interactions
            provider
                .given('I have circle customer_user demo+circle@prenetics.com with password 12345678')
                .uponReceiving('auth with username and password')
                .withRequest({
                    method: 'POST',
                    path: '/authentication/v1.0/token/user',
                    headers: {
                        'Content-type': 'application/json',
                    },
                    body: {
                        username: email('demo+circle@prenetics.com'),
                        password: term({
                            generate: '12345678',
                            matcher: ValidationRegex.ValidPassword.source,
                        }),
                        locale: 'en-HK',
                    },
                })
                .willRespondWith({
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                    },
                    body: {
                        token: term({
                            generate: 'AUTH_TOKEN',
                            matcher: '^[\\w-]*.[\\w-]*.[\\w-]*$',
                        }),
                    },
                });

            return provider.executeTest(async mockserver => {
                // Act: test our API client behaves correctly
                axios.defaults.baseURL = mockserver.url;
                const { result } = renderHook(() => useAuth(), {
                    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
                });
                expect(result.current.token).toBeUndefined();
                await act(async () => {
                    await expect(result.current.login('demo+circle@prenetics.com', '12345678')).resolves.toEqual('AUTH_TOKEN');
                });

                // Assert: check the result
                expect(result.current.token).toBe('AUTH_TOKEN');
            });
        });

        test('missing password', async () => {
            // Arrange: Setup our expected interactions
            provider
                .given('I have circle customer_user demo+circle@prenetics.com with password 12345678')
                .uponReceiving('auth without password')
                .withRequest({
                    method: 'POST',
                    path: '/authentication/v1.0/token/user',
                    headers: {
                        'Content-type': 'application/json',
                    },
                    body: {
                        username: email('demo+circle@prenetics.com'),
                        password: term({
                            generate: '',
                            matcher: '^$',
                        }),
                        locale: 'en-HK',
                    },
                })
                .willRespondWith({
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                    },
                    body: {
                        error_code: 'BadRequest',
                        error_message: [
                            {
                                location: 'body',
                                param: 'password',
                                msg: 'Password is required',
                                value: '',
                            },
                        ],
                    },
                });

            return provider.executeTest(async mockserver => {
                // Act: test our API client behaves correctly
                axios.defaults.baseURL = mockserver.url;
                const { result } = renderHook(() => useAuth(), {
                    wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
                });
                expect(result.current.token).toBeUndefined();
                await act(async () => {
                    await expect(result.current.login('demo@prenetics.com', '')).rejects.not.toBeUndefined();
                });

                // Assert: check the result
                expect(result.current.token).toBeUndefined();
            });
        });
    });

    describe('request OTP', () => {
        describe('with account verification', () => {
            test('account not exists', async () => {
                // Arrange: Setup our expected interactions
                provider
                    .given('I have circle customer_user demo+circle@prenetics.com with password 12345678')
                    .uponReceiving('request OTP with account verification for demo+nouser@prenetics.com that does not exist')
                    .withRequest({
                        method: 'POST',
                        path: '/authentication/v1.0/otp',
                        headers: {
                            'Content-type': 'application/json',
                        },
                        body: {
                            username: 'demo+nouser@prenetics.com',
                            type: 'email',
                            lang: 'en-HK',
                        },
                        query: {
                            verify: 'true',
                        },
                    })
                    .willRespondWith({
                        status: 400,
                        headers: {
                            'Content-Type': 'application/json; charset=utf-8',
                        },
                        body: {
                            error_code: 'BadRequest',
                            error_message: 'user demo+nouser@prenetics.com does not exist',
                        },
                    });

                return provider.executeTest(async mockserver => {
                    // Act: test our API client behaves correctly
                    axios.defaults.baseURL = mockserver.url;
                    const { result } = renderHook(() => useAuth(), {
                        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
                    });

                    // Assert: check the result
                    await act(async () => {
                        await expect(result.current.requestOtp('demo+nouser@prenetics.com', true)).rejects.toBeInstanceOf(AuthenticationError);
                        await expect(result.current.requestOtp('demo+nouser@prenetics.com', true)).rejects.toHaveProperty('reason', AuthenticationErrorReason.NotExists);
                    });
                });
            });
        });
    });
});
