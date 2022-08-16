import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { iso8601DateTimeWithMillis, uuid } from '@pact-foundation/pact/src/dsl/matchers';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import path from 'path';
import { CreateProfileContext } from '../../../service/api/profile/profile';
import { Gender, Ethnicity } from '../../../service/api/profile/type';
import { useAuth } from '../../AuthProvider/AuthProvider';
import { ProfileProvider, useProfile } from '../ProfileProvider';
import { getCustomerUserToken } from './jwt';

jest.mock('../../AuthProvider/AuthProvider');

afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
});
beforeAll(() => {
    axios.defaults.adapter = require('axios/lib/adapters/http');
});

const username = 'demo+circle@prenetics.com';
const customerId = '69dd7f57-8aa5-4fad-8132-ae70b358ac54';
const createProfileContext = {
    firstName: 'John',
    lastName: 'Woo',
    health: {
        weight: {
            value: 80,
            unit: 'kg',
        },
        height: {
            value: 200,
            unit: 'cm',
        },
        gender: Gender.male,
        dob: '1989-04-11',
        ethnicity: Ethnicity.nativeAmerican,
    },
    locale: 'en-HK',
    email: username,
};

const provider = new PactV3({
    consumer: 'reactcontextprovider',
    provider: 'profile',
    logLevel: 'error',
    dir: path.resolve(process.cwd(), '.pact'),
});

const customeruserToken = getCustomerUserToken(username, customerId);

describe('create profile', () => {
    test('create a new profile', async () => {
        // Create a profile
        provider
            .uponReceiving('profile creation')
            .withRequest({
                method: 'POST',
                path: '/profile/v1.0/profile',
                headers: {
                    'Content-type': 'application/json',
                    Authorization: `Bearer ${customeruserToken}`,
                },
                query: {
                    health: 'true',
                    email: 'true',
                    preference: 'true',
                },
                body: JSON.stringify({
                    profile: {
                        name: {
                            firstName: createProfileContext.firstName,
                            lastName: createProfileContext.lastName,
                        },
                        email: {
                            name: uuid('814a415a-3c18-4f09-9ff5-e3a2918e5efe'),
                            primary: true,
                            detail: {
                                email: createProfileContext.email,
                            },
                        },
                        health: {
                            ...createProfileContext.health,
                            weight: {
                                value: createProfileContext.health?.weight?.value.toFixed(1),
                                unit: createProfileContext.health?.weight?.unit,
                            },
                        },
                        preference: {
                            language: createProfileContext.locale,
                        },
                    },
                }),
            })
            .willRespondWith({
                status: 201,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: {
                    owner: customerId,
                    name: {
                        nameId: uuid('6f96b4c3-30aa-4a31-818a-a3171999bcdc'),
                        firstName: createProfileContext.firstName,
                        lastName: createProfileContext.lastName,
                    },
                    profileId: uuid('ea12c003-14dd-4bc3-8cad-12da759c916a'),
                    health: {
                        weightUnit: createProfileContext.health.weight.unit,
                        weight: createProfileContext.health.weight.value.toFixed(1),
                        heightUnit: createProfileContext.health.height.unit,
                        height: createProfileContext.health.height.value,
                        dob: createProfileContext.health.dob,
                        yob: createProfileContext.health.dob.slice(0, 4),
                        gender: createProfileContext.health.gender,
                        ethnicity: createProfileContext.health?.ethnicity,
                        healthId: uuid('082402be-0a4b-43a6-9107-3fb6cba56996'),
                    },
                    email: [
                        {
                            primary: true,
                            name: uuid('814a415a-3c18-4f09-9ff5-e3a2918e5efe'),
                            email: createProfileContext.email,
                            emailId: uuid('b3cab04c-0efb-4ec0-ac1d-88c399215978'),
                            datetime: iso8601DateTimeWithMillis('2022-04-11T12:29:44.459Z'),
                        },
                    ],
                    preference: {
                        language: createProfileContext.locale,
                        preferenceId: uuid('f5621803-dad5-4888-bfa2-83d83a2e1ab3'),
                    },
                },
            });

        // Get all profiles
        const EXPECTED_PROFILES: MatchersV3.AnyTemplate = [
            {
                profileId: uuid('1946ac7c-a961-4282-aa35-7776e360b68a'),
                owner: customerId,
                root: true,
                email: [
                    {
                        primary: true,
                        name: 'email',
                        email: username,
                        emailId: uuid('93a374ed-6617-4198-b2e3-6edfa4be8c8f'),
                        datetime: iso8601DateTimeWithMillis(),
                        profile: uuid('1946ac7c-a961-4282-aa35-7776e360b68a'),
                    },
                ],
                name: {
                    nameId: uuid('fd34ebee-7ac1-494f-b91d-7347527d2bd8'),
                    nickName: username,
                    profile: uuid('1946ac7c-a961-4282-aa35-7776e360b68a'),
                },
                phone: [],
                preference: {
                    preferenceId: uuid('838e00e7-b98f-4db2-b5f6-56d7622e43de'),
                    language: 'en-HK',
                    profile: uuid('1946ac7c-a961-4282-aa35-7776e360b68a'),
                },
                tag: [],
            },
            {
                profileId: uuid('ea12c003-14dd-4bc3-8cad-12da759c916a'),
                owner: customerId,
                name: {
                    nameId: uuid('6f96b4c3-30aa-4a31-818a-a3171999bcdc'),
                    firstName: createProfileContext.firstName,
                    lastName: createProfileContext.lastName,
                },
                health: {
                    weightUnit: createProfileContext.health.weight.unit,
                    weight: createProfileContext.health.weight.value.toFixed(1),
                    heightUnit: createProfileContext.health.height.unit,
                    height: createProfileContext.health.height.value,
                    dob: createProfileContext.health.dob,
                    yob: createProfileContext.health.dob.slice(0, 4),
                    gender: createProfileContext.health.gender,
                    ethnicity: createProfileContext.health?.ethnicity,
                    healthId: uuid('082402be-0a4b-43a6-9107-3fb6cba56996'),
                },
                email: [
                    {
                        primary: true,
                        name: uuid('814a415a-3c18-4f09-9ff5-e3a2918e5efe'),
                        email: createProfileContext.email,
                        emailId: uuid('b3cab04c-0efb-4ec0-ac1d-88c399215978'),
                        datetime: iso8601DateTimeWithMillis(),
                    },
                ],
                preference: {
                    language: createProfileContext.locale,
                    preferenceId: uuid('f5621803-dad5-4888-bfa2-83d83a2e1ab3'),
                },
            },
        ];

        provider
            .given(
                `I have circle customer_user demo+circle@prenetics.com with customerid ${customerId} and a root profile and a non root profile {"firstName":"John","lastName":"Woo","health":{"weight":{"value":80,"unit":"kg"},"height":{"value":200,"unit":"cm"},"gender":"male","dob":"1989-04-11","ethnicity":"nativeamerican"},"locale":"en-HK","email":"demo+circle@prenetics.com"}`,
            )
            .uponReceiving('get profiles')
            .withRequest({
                method: 'GET',
                path: '/profile/v1.0/profile',
                headers: {
                    Authorization: `Bearer ${customeruserToken}`,
                },
            })
            .willRespondWith({
                status: 200,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: EXPECTED_PROFILES,
            });

        return provider.executeTest(async mockserver => {
            // Act: test our API client behaves correctly
            axios.defaults.baseURL = mockserver.url;
            (useAuth as jest.Mock).mockReturnValue({
                token: customeruserToken,
            });
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Assert: check the result
            expect(result.current.currentProfile).toBeUndefined();
            // make sure provider is fully initialized first
            await waitFor(() => expect(result.current.isProfileReady).toBeTruthy());
            await act(async () => {
                await expect(result.current.createProfile(createProfileContext as CreateProfileContext)).resolves.toEqual({
                    owner: customerId,
                    name: {
                        nameId: '6f96b4c3-30aa-4a31-818a-a3171999bcdc',
                        firstName: createProfileContext.firstName,
                        lastName: createProfileContext.lastName,
                    },
                    root: false,
                    profileId: 'ea12c003-14dd-4bc3-8cad-12da759c916a',
                });
            });
            expect(result.current.currentProfile?.profileId).toEqual('ea12c003-14dd-4bc3-8cad-12da759c916a');
        });
    });
});
