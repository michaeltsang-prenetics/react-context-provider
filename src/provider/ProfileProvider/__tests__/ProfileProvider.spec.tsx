import { act, renderHook, waitFor } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../ProfileProvider';
import * as ProfileService from '../../../service/api/profile/profile';
import { useAuth } from '../../AuthProvider/AuthProvider';
import { CreateProfileContext, DeleteProfileContext } from '../../../service/api/profile/profile';
import { Profile, Ethnicity, Gender } from '../../../service/api/profile/type';
import { AuthorizationError, AuthorizationErrorReason } from '../../../type/error/AuthorizationError';

jest.mock('../../../service/api/profile/profile');
jest.mock('../../AuthProvider/AuthProvider');

afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
});

const stubRootProfile: Profile = {
    profileId: 'e7f42a4f-7357-427c-b205-8a52e9861d07',
    owner: '361d8359-af79-4fb6-9508-4e1bfe3754de',
    root: true,
    name: {
        nameId: '8ae2694b-c633-43bb-b67e-50460cc943d9',
    },
    email: [
        {
            emailId: 'c9cfbbef-22d1-4edc-a89e-137074ecd335',
            datetime: '2022-01-08T19:57:46.573Z',
            primary: true,
            name: 'email',
            email: 'mtcircle17@prenetics.com',
        },
    ],
    tag: [],
    preference: {
        preferenceId: '85f6de6a-7a3f-41c3-9600-ce46e06cbd9c',
        language: 'en-HK',
    },
};

const stubProfile: Profile = {
    profileId: '28264924-25a6-4d65-be8a-6ba4d598b3d3',
    owner: 'ec8164b4-5d6c-409e-9ab8-b29f26eb978f',
    root: false,
    name: {
        firstName: 'Mock',
        lastName: 'One',
    },
    health: {
        dob: '1990-12-12',
        ethnicity: Ethnicity.southAsian,
        gender: Gender.male,
        healthId: 'ce51f3e7-4cbb-4ba3-b094-8d5dc615b058',
        height: {
            value: 66,
            unit: 'cm',
        },
        weight: {
            value: 55.1,
            unit: 'kg',
        },
    },
    email: [],
    tag: [],
    preference: { language: 'en-HK', preferenceId: 'c0c1c4c4-9273-4b74-ac29-b9d600082020' },
    phone: [{ number: '98765432', countryCode: 'hk', name: 'xPhone', datetime: '2022-01-08T19:57:46.573Z' }],
};

const stubProfile_JohnD: Profile = {
    profileId: '65185B6C-E311-4ACA-9FE5-9337A4B8C6CA',
    owner: 'circle',
    root: false,
    name: { firstName: 'John', lastName: 'D' },
};

const stubProfile_JaneB: Profile = {
    profileId: '6978E6BC-176F-48B2-98DA-13A26DC1A63D',
    owner: 'circle',
    root: false,
    name: { firstName: 'Jane', lastName: 'B' },
};

const stubDeleteProfileContext: DeleteProfileContext = {
    profileId: '28264924-25a6-4d65-be8a-6ba4d598b3d3',
};

const stubCreateProfileContext: CreateProfileContext = {
    firstName: 'Mock',
    lastName: 'Test',
    health: {
        gender: Gender.male,
        dob: '1990-11-19',
        ethnicity: Ethnicity.southAsian,
    },
    locale: 'en-HK',
    email: 'rajesh.be+test1@prenetics.com',
};

describe('init', () => {
    test('token update should init profile status', async () => {
        // Arrange
        (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
        (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });

        // Act + Assert
        expect(result.current.rootProfile).toBeUndefined();
        expect(result.current.currentProfile).toBeUndefined();
        expect(result.current.isProfileReady).toBeFalsy();
        await waitFor(() => {
            expect(result.current.rootProfile).toEqual(stubRootProfile);
            expect(result.current.currentProfile).toEqual(stubProfile);
            expect(result.current.isProfileReady).toBeTruthy();
        });
    });

    test('with no token should set provider state to be ready', async () => {
        // Arrange
        (useAuth as jest.Mock).mockReturnValue({ token: '' });
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });

        // Act + Assert
        expect(result.current.rootProfile).toBeUndefined();
        expect(result.current.currentProfile).toBeUndefined();
        expect(result.current.isProfileReady).toBeTruthy();
    });
});

describe('@createProfile', () => {
    test('without token should throw error', async () => {
        // Arrange
        (useAuth as jest.Mock).mockReturnValue({ token: undefined });
        (ProfileService.postCreateProfile as jest.Mock).mockResolvedValue(stubCreateProfileContext);
        (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });

        // Act + Assert
        expect(result.current.profiles).toBeUndefined();
        await expect(result.current.createProfile(stubCreateProfileContext)).rejects.toThrow(new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized));
        expect(result.current.profiles).toBeUndefined();
    });

    describe('with existing profiles', () => {
        test('should switch current profile to the new one', async () => {
            // Arrange
            (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile_JohnD]);
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile).toBeUndefined();
            await waitFor(() => expect(result.current.currentProfile).toBe(stubProfile_JohnD));
            (ProfileService.postCreateProfile as jest.Mock).mockResolvedValue(stubProfile_JaneB);
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile_JohnD, stubProfile_JaneB]);
            await act(async () => {
                await expect(result.current.createProfile(stubCreateProfileContext)).resolves.toEqual(stubProfile_JaneB);
            });
            expect(result.current.currentProfile).toEqual(stubProfile_JaneB);
        });

        test('should keep current profile status', async () => {
            // Arrange
            (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile_JohnD]);
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile).toBeUndefined();
            await waitFor(() => expect(result.current.currentProfile).toBe(stubProfile_JohnD));
            (ProfileService.postCreateProfile as jest.Mock).mockRejectedValue('error');
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile_JohnD, stubProfile_JaneB]);
            await act(async () => {
                await expect(result.current.createProfile(stubCreateProfileContext)).rejects.not.toBeUndefined();
            });
            expect(result.current.currentProfile).toEqual(stubProfile_JohnD);
        });
    });
});

describe('@updateProfile', () => {
    describe('state should be reflected in current profile', () => {
        test('update name', async () => {
            // Arrange
            const profileCategory = { name: stubProfile.name };
            (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
            (ProfileService.putUpdateProfileName as jest.Mock).mockResolvedValue(profileCategory.name);
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile?.name.firstName).toBeUndefined();
            await act(async () => result.current.updateProfile(stubProfile.profileId, profileCategory));
            expect(result.current.currentProfile?.name.firstName).toEqual(stubProfile.name.firstName);
            expect(result.current.profiles).toEqual([stubProfile]);
        });

        test('update preference', async () => {
            // Arrange
            const profileCategory = { preference: stubProfile.preference };
            (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
            (ProfileService.putUpdateProfilePreference as jest.Mock).mockResolvedValue(profileCategory.preference);
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile?.preference?.language).toBeUndefined();
            await act(async () => result.current.updateProfile(stubProfile.profileId, profileCategory));
            expect(result.current.currentProfile?.preference?.language).toEqual(stubProfile.preference?.language);
            expect(result.current.profiles).toEqual([stubProfile]);
        });

        test('update health', async () => {
            // Arrange
            const profileCategory = { health: stubProfile.health };
            (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
            (ProfileService.putUpdateProfileHealth as jest.Mock).mockResolvedValue(profileCategory.health);
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile?.health?.dob).toBeUndefined();
            await act(async () => result.current.updateProfile(stubProfile.profileId, profileCategory));
            expect(result.current.currentProfile?.health?.dob).toEqual(stubProfile.health?.dob);
            expect(result.current.profiles).toEqual([stubProfile]);
        });

        test('update phone', async () => {
            // Arrange
            const profileCategory = { phone: stubProfile.phone ? stubProfile.phone[0] : undefined };
            (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
            (ProfileService.patchUpdateProfile as jest.Mock).mockResolvedValue(profileCategory);
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile?.phone).toBeUndefined();
            await act(async () => result.current.updateProfile(stubProfile.profileId, profileCategory));
            expect(result.current.currentProfile?.phone).toEqual(stubProfile.phone);
            expect(result.current.profiles).toEqual([stubProfile]);
        });
    });

    describe('without authorization should throw error', () => {
        test('update name', async () => {
            // Arrange
            const profileCategory = { name: stubProfile.name };
            (useAuth as jest.Mock).mockReturnValue({ token: undefined });
            (ProfileService.putUpdateProfileName as jest.Mock).mockResolvedValue(profileCategory.name);
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile?.name.firstName).toBeUndefined();
            await expect(result.current.updateProfile(stubProfile.profileId, profileCategory)).rejects.toThrow(new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized));
            expect(result.current.currentProfile?.name.firstName).toBeUndefined();
            expect(result.current.profiles).toBeUndefined();
        });

        test('update preference', async () => {
            // Arrange
            const profileCategory = { preference: stubProfile.preference };
            (useAuth as jest.Mock).mockReturnValue({ token: undefined });
            (ProfileService.putUpdateProfilePreference as jest.Mock).mockResolvedValue(profileCategory.preference);
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile?.preference?.language).toBeUndefined();
            expect(result.current.updateProfile(stubProfile.profileId, profileCategory)).rejects.toThrow(new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized));
            expect(result.current.currentProfile?.preference?.language).toBeUndefined();
            expect(result.current.profiles).toBeUndefined();
        });

        test('update health', async () => {
            // Arrange
            const profileCategory = { health: stubProfile.health };
            (useAuth as jest.Mock).mockReturnValue({ token: undefined });
            (ProfileService.putUpdateProfileHealth as jest.Mock).mockResolvedValue(profileCategory.health);
            (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubProfile]);
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile?.health?.dob).toBeUndefined();
            expect(result.current.updateProfile(stubProfile.profileId, profileCategory)).rejects.toThrow(new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized));
            expect(result.current.currentProfile?.health?.dob).toBeUndefined();
            expect(result.current.profiles).toBeUndefined();
        });

        test('update phone', async () => {
            // Arrange
            (useAuth as jest.Mock).mockReturnValue({ token: undefined });
            const { result } = renderHook(() => useProfile(), {
                wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
            });

            // Act + Assert
            expect(result.current.currentProfile?.phone).toBeUndefined();
            expect(result.current.updateProfile(stubProfile.profileId, { phone: { number: '98765432', countryCode: 'hk' } })).rejects.toThrow(
                new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized),
            );
            expect(result.current.currentProfile?.phone).toBeUndefined();
            expect(result.current.profiles).toBeUndefined();
        });
    });
});

describe('@deleteProfile', () => {
    test('delete current profile should reset profile status', async () => {
        // Arrange
        (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
        (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
        (ProfileService.deleteRemoveProfile as jest.Mock).mockResolvedValue(stubDeleteProfileContext);
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });

        // Act + Assert init
        expect(result.current.currentProfile).toBeUndefined();
        await waitFor(() => expect(result.current.currentProfile).toEqual(stubProfile));

        // remove all profies for mock
        (ProfileService.getProfiles as jest.Mock).mockResolvedValue([]);

        // Act + Assert
        await act(async () => result.current.deleteProfile(stubDeleteProfileContext.profileId));
        expect(result.current.profiles).toMatchObject([]);
        expect(result.current.currentProfile).toBeUndefined();
    });

    test('without authorization should throw error', async () => {
        // Arrange
        (useAuth as jest.Mock).mockReturnValue({ token: undefined });
        (ProfileService.deleteRemoveProfile as jest.Mock).mockResolvedValue(stubProfile);
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });

        // Act + Assert
        expect(result.current.profiles).toBeUndefined();
        await act(async () => {
            await expect(result.current.deleteProfile(stubDeleteProfileContext.profileId)).rejects.toThrow(new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized));
        });
        expect(result.current.profiles).toBeUndefined();
    });
});
