import React, { PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { ProfileContext } from './context/ProfileContext';
import * as ProfileService from '../../service/api/profile/profile';
import { ApiErrorHandler } from '../handler';
import { useAuth } from '../AuthProvider/AuthProvider';
import { getRootProfile, getStandardProfile } from './filter';
import { CreateProfileContext } from '../../service/api/profile/profile';
import equal from 'fast-deep-equal';
import { usePrevious } from '../../hook/usePrevious';
import { Profile, ProfileCategory, Identity, ProfileIdentity, Address } from '../../service/api/profile/type';

type Props = {
    locale?: string;
    capturing?: (e: unknown) => void;
};

export const ProfileProvider: React.FC<PropsWithChildren<Props>> = ({ children, locale = 'en-HK', capturing }) => {
    const [isReady, setReady] = useState(false);
    const [profiles, setStandardProfiles] = useState<Profile[]>();
    const [rootProfile, setRootProfile] = useState<Profile>();
    const [currentProfile, setCurrentProfile] = useState<Profile | undefined>();
    const { token } = useAuth();
    const prevRootProfile = usePrevious(rootProfile);
    const prevCurrentProfile = usePrevious(currentProfile);

    const capture = useCallback(
        (e: unknown) => {
            if (capturing) capturing(e);
        },
        [capturing],
    );

    const refreshProfiles = useCallback(async () => {
        if (!token) return;
        const profiles = await ProfileService.getProfiles(token, ApiErrorHandler);

        setStandardProfiles(getStandardProfile(profiles));
        setRootProfile(getRootProfile(profiles));
    }, [token]);

    const createProfile = useCallback(
        async (profile: CreateProfileContext) => {
            try {
                if (!token) throw new Error('Not authorized');
                console.log(`Creating profile ${profile.firstName} ${profile.lastName}`);
                const newProfie = await ProfileService.postCreateProfile(
                    {
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        health: profile.health,
                        locale: profile.locale,
                        email: profile.email,
                    },
                    token,
                    ApiErrorHandler,
                );
                if (!newProfie) throw new Error('Profile creation failed');
                await refreshProfiles();
                setCurrentProfile(newProfie);
                return newProfie;
            } catch (error) {
                capture(error);
                return Promise.reject(error instanceof Error ? error.message : 'Unexpected error');
            }
        },
        [capture, refreshProfiles, token],
    );

    const updateProfile = useCallback(
        async (profileId: string, category: ProfileCategory, refresh = true) => {
            try {
                if (!token) throw new Error('Not authorized');

                category.preference &&
                    category.preference?.language &&
                    (await ProfileService.putUpdateProfilePreference(
                        {
                            profileId: profileId,
                            language: category.preference.language,
                            location: category.preference.location || undefined,
                        },
                        token,
                        ApiErrorHandler,
                    ));

                category.name &&
                    category.name?.firstName &&
                    category.name?.lastName &&
                    (await ProfileService.putUpdateProfileName(
                        {
                            profileId: profileId,
                            firstName: category.name.firstName,
                            lastName: category.name.lastName,
                        },
                        token,
                        ApiErrorHandler,
                    ));

                category.health &&
                    category.health?.gender &&
                    category.health.dob &&
                    category.health.ethnicity &&
                    category.health.height &&
                    category.health.weight &&
                    (await ProfileService.putUpdateProfileHealth(
                        {
                            profileId: profileId,
                            gender: category.health.gender,
                            dob: category.health.dob,
                            ethnicity: category.health.ethnicity,
                            height: {
                                value: category.health.height.value,
                                unit: category.health.height.unit,
                            },
                            weight: {
                                value: category.health.weight.value,
                                unit: category.health.weight.unit,
                            },
                        },
                        token,
                        ApiErrorHandler,
                    ));

                category.phone &&
                    (await ProfileService.patchUpdateProfile(
                        {
                            profileId,
                            phone: category.phone,
                        },
                        token,
                        ApiErrorHandler,
                    ));

                if (refresh) {
                    console.log('Refresh after profile update');
                    await refreshProfiles();
                }
            } catch (error) {
                capture(error);
                return Promise.reject(error instanceof Error ? error.message : 'Unexpected error');
            }
        },
        [capture, refreshProfiles, token],
    );

    const deleteProfile = useCallback(
        async (profileId: string) => {
            try {
                if (!token) throw new Error('Not authorized');
                await ProfileService.deleteRemoveProfile({ profileId: profileId }, token, ApiErrorHandler);
                await refreshProfiles();
            } catch (error) {
                capture(error);
                return Promise.reject(error instanceof Error ? error.message : 'Unexpected error');
            }
        },
        [capture, refreshProfiles, token],
    );

    const createTag = useCallback(
        async (profile: Profile, tag: string, token: string) => {
            await ProfileService.postCreateTag(
                {
                    profileId: profile.profileId,
                    tag: tag,
                },
                token,
                ApiErrorHandler,
            );
            await refreshProfiles();
        },
        [refreshProfiles],
    );

    const updateTag = useCallback(
        async (profile: Profile, tag: string, token: string) => {
            await ProfileService.putUpdateTag(
                {
                    profileId: profile.profileId,
                    tag: tag,
                },
                token,
                ApiErrorHandler,
            );
            await refreshProfiles();
        },
        [refreshProfiles],
    );

    const deleteTag = useCallback(
        async (profile: Profile, tagId: string, token: string) => {
            await ProfileService.deleteTag(
                {
                    profileId: profile.profileId,
                    tagId,
                },
                token,
                ApiErrorHandler,
            );
            await refreshProfiles();
        },
        [refreshProfiles],
    );

    const createIdentity = useCallback(
        async (profileId: string, identity: Identity) => {
            if (!token) throw new Error('Not authorized');
            await ProfileService.postProfileIdentity(
                {
                    profileId,
                    ...identity,
                },
                token,
                ApiErrorHandler,
            );
            await refreshProfiles();
        },
        [refreshProfiles, token],
    );

    const updateIdentity = useCallback(
        async (profileId: string, profileIdentity: ProfileIdentity) => {
            if (!token) throw new Error('Not authorized');
            await ProfileService.putUpdateProfileIdentity(
                {
                    profileId,
                    ...profileIdentity,
                },
                token,
                ApiErrorHandler,
            );
            await refreshProfiles();
        },
        [refreshProfiles, token],
    );

    const deleteIdentity = useCallback(
        async (profileId: string, identityId: string) => {
            if (!token) throw new Error('Not authorized');
            await ProfileService.deleteProfileIdentity(
                {
                    profileId,
                    identityId,
                },
                token,
                ApiErrorHandler,
            );
            await refreshProfiles();
        },
        [refreshProfiles, token],
    );

    const createAddress = useCallback(
        async (profileId: string, address: Address) => {
            if (!token) throw new Error('Not authorized');
            await ProfileService.postCreateProfileAddress(
                {
                    profileId,
                    address,
                },
                token,
                ApiErrorHandler,
            );
            await refreshProfiles();
        },
        [refreshProfiles, token],
    );

    // const updateQuestionnaire = useCallback(
    //     async (profileId: string, questionnaire: Questionnaire) => {
    //         if (!token) throw new Error('Not authorized');

    //         const profile = profiles?.find(profile => profile.profileId === profileId);
    //         if (!profile) throw new Error(`Missing profile ${profileId}`);
    //         const healthId = profile?.health?.healthId;
    //         if (!healthId) throw new Error(`Missing health record in profile ${profileId}`);

    //         await ProfileService.putUpdateQuestionnaire({ healthId, owner: profile.owner, answers: questionnaire }, token, ApiErrorHandler);
    //         await refreshProfiles();
    //     },
    //     [profiles, refreshProfiles, token],
    // );

    // Init Profile Provider
    useEffect(() => {
        if (token) {
            refreshProfiles()
                .catch(e => capture(e))
                .finally(async () => {
                    setReady(true);
                });
        } else {
            setReady(true);
        }
    }, [capture, refreshProfiles, token]);

    // Init/Update Current Profile
    useEffect(() => {
        const GetCachedCurrentProfileId = async (profile: Profile) => {
            // return await UserStorage.get(UserStorage.UserKey.CurrentProfile, profile.profileId);
            return '';
        };

        if (profiles) {
            if (profiles.length === 0) {
                setCurrentProfile(undefined);
            } else if (currentProfile) {
                const update = profiles.find(profile => profile.profileId === currentProfile.profileId);
                if (!equal(update, currentProfile)) {
                    console.log('Update default profile', update?.profileId);
                    setCurrentProfile(update);
                }
            } else {
                if (!rootProfile) return;
                GetCachedCurrentProfileId(rootProfile).then(cachedCurrentProfileId => {
                    const profile = profiles.find(profile => profile.profileId === cachedCurrentProfileId);
                    if (profile) {
                        console.log('Set default profile to last selected profile', profile.profileId);
                        setCurrentProfile(profile);
                    } else {
                        console.log('Set default profile', profiles[0].profileId);
                        setCurrentProfile(profiles[0]);
                    }
                });
            }
        }
    }, [currentProfile, profiles, rootProfile]);

    // Update locale for root profile whenever switch/login to an account
    useEffect(() => {
        if (rootProfile && prevRootProfile?.profileId !== rootProfile.profileId) {
            if (rootProfile.preference?.language !== locale) {
                console.log(`Update account language to ${locale}`);
                // Don't really care if it fails
                updateProfile(rootProfile.profileId, { preference: { language: locale } }, false).catch(error => capture(error));
            }
        }
    }, [capture, locale, prevRootProfile?.profileId, rootProfile, updateProfile]);

    // Update locale for user profile whenever switching/creating a new profile
    useEffect(() => {
        if (currentProfile && prevCurrentProfile?.profileId !== currentProfile.profileId) {
            if (currentProfile.preference?.language !== locale) {
                console.log(`Update profile language to ${locale} from ${currentProfile.preference?.language}`);
                // Don't really care if it fails
                updateProfile(currentProfile.profileId, { preference: { language: locale } }, false).catch(error => capture(error));
            }
        }
    }, [locale, prevCurrentProfile, currentProfile, updateProfile, capture]);

    // Clean up (Basically logout)
    useEffect(() => {
        if (!token) {
            setRootProfile(undefined);
            setStandardProfiles(undefined);
            setCurrentProfile(undefined);
        }
    }, [token]);

    const profileContext = React.useMemo(
        () => ({
            isProfileReady: isReady,
            profiles,
            rootProfile,
            currentProfile,
            setCurrentProfile,
            createProfile,
            updateProfile,
            deleteProfile,
            createTag,
            updateTag,
            deleteTag,
            createIdentity,
            updateIdentity,
            deleteIdentity,
            createAddress,
        }),
        [isReady, profiles, rootProfile, currentProfile, createProfile, updateProfile, deleteProfile, createTag, updateTag, deleteTag, createIdentity, updateIdentity, deleteIdentity, createAddress],
    );

    return <ProfileContext.Provider value={profileContext}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => useContext(ProfileContext);
