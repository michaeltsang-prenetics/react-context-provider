import { act, renderHook, waitFor } from '@testing-library/react';
import { ProfileProvider, useProfile } from '../ProfileProvider';
import * as ProfileService from '../../../service/api/profile/profile';
import { useAuth } from '../../AuthProvider/AuthProvider';
import { AuthorizationError, AuthorizationErrorReason } from '../../../type/error/AuthorizationError';
import { stubCreateProfileContext, stubDeleteProfileContext, stubProfile, stubProfile_JaneB, stubProfile_JohnD, stubRootProfile, stubRootProfileWithoutLanguage } from './resource/stub';

jest.mock('../../../service/api/profile/profile');
jest.mock('../../AuthProvider/AuthProvider');

afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
});

describe('init', () => {
    test('token update should init profile status', async () => {
        // Arrange
        (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile]);
        (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });

        // Act
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });

        // Assert
        expect(result.current.rootProfile).toBeUndefined();
        expect(result.current.currentProfile).toBeUndefined();
        expect(result.current.isProfileReady).toBeFalsy();
        await waitFor(() => {
            expect(result.current.rootProfile).toEqual(stubRootProfile);
            expect(result.current.currentProfile).toEqual(stubProfile);
            expect(result.current.isProfileReady).toBeTruthy();
        });
    });

    test('update profile language', async () => {
        // Arrange
        // const mockUpdateProfile = ProfileService.putUpdateProfilePreference as jest.Mock;
        (ProfileService.getProfiles as jest.Mock).mockResolvedValueOnce([stubRootProfileWithoutLanguage, stubProfile]).mockResolvedValueOnce([stubRootProfile, stubProfile]);
        (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });

        // Act
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });

        // Assert
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

        // Act
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });

        // Assert
        await waitFor(() => {
            expect(result.current.rootProfile).toBeUndefined();
            expect(result.current.currentProfile).toBeUndefined();
            expect(result.current.isProfileReady).toBeTruthy();
        });
    });

    test('@refreshProfile failed', async () => {
        // Arrange
        (ProfileService.getProfiles as jest.Mock).mockImplementation(() => {
            throw new Error();
        });
        (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });

        // Act
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });

        // Assert
        await waitFor(() => {
            expect(result.current.rootProfile).toBeUndefined();
            expect(result.current.currentProfile).toBeUndefined();
            expect(result.current.isProfileReady).toBeTruthy();
        });
    });

    test('defauld profile', async () => {
        // Arrange
        (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile, stubProfile_JohnD]);
        (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });

        // Act
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider pid={'65185B6C-E311-4ACA-9FE5-9337A4B8C6CA'}>{children}</ProfileProvider>,
        });

        // Assert
        expect(result.current.rootProfile).toBeUndefined();
        expect(result.current.currentProfile).toBeUndefined();
        expect(result.current.isProfileReady).toBeFalsy();
        await waitFor(() => {
            expect(result.current.rootProfile).toEqual(stubRootProfile);
            expect(result.current.currentProfile).toEqual(stubProfile_JohnD);
            expect(result.current.isProfileReady).toBeTruthy();
        });
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

describe('@setCurrentProfile', () => {
    test('with correct profile', async () => {
        // Arrange
        (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile_JohnD, stubProfile_JaneB]);
        (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });
        // Init with JaneB profile since it is created lasted (according to email creation)
        expect(result.current.rootProfile).toBeUndefined();
        expect(result.current.currentProfile).toBeUndefined();
        expect(result.current.isProfileReady).toBeFalsy();
        await waitFor(() => {
            expect(result.current.rootProfile).toEqual(stubRootProfile);
            expect(result.current.profiles).toEqual([stubProfile_JaneB, stubProfile_JohnD]);
            expect(result.current.currentProfile).toEqual(stubProfile_JaneB);
            expect(result.current.isProfileReady).toBeTruthy();
        });

        // Act
        await act(() => result.current.setCurrentProfile(stubProfile_JohnD));

        // Assert
        await waitFor(() => expect(result.current.currentProfile).toEqual(stubProfile_JohnD));
    });

    test('with unknown profile should not update anything', async () => {
        // Arrange
        (ProfileService.getProfiles as jest.Mock).mockResolvedValue([stubRootProfile, stubProfile_JaneB]);
        (useAuth as jest.Mock).mockReturnValue({ token: 'AUTH_TOKEN' });
        const { result } = renderHook(() => useProfile(), {
            wrapper: ({ children }) => <ProfileProvider>{children}</ProfileProvider>,
        });
        // Init with JaneB profile since it is created lasted (according to email creation)
        expect(result.current.rootProfile).toBeUndefined();
        expect(result.current.currentProfile).toBeUndefined();
        expect(result.current.isProfileReady).toBeFalsy();
        await waitFor(() => {
            expect(result.current.rootProfile).toEqual(stubRootProfile);
            expect(result.current.profiles).toEqual([stubProfile_JaneB]);
            expect(result.current.currentProfile).toEqual(stubProfile_JaneB);
            expect(result.current.isProfileReady).toBeTruthy();
        });

        // Act
        await act(() => result.current.setCurrentProfile(stubProfile_JohnD));

        // Assert
        await waitFor(() => expect(result.current.currentProfile).toEqual(stubProfile_JaneB));
    });
});
