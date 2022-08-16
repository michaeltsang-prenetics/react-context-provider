import React, { PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { ProfileContext } from './context/ProfileContext';
import * as ProfileService from '../../service/api/profile/profile';
import { ApiErrorHandler } from '../handler';
import { useAuth } from '../AuthProvider/AuthProvider';
import { getRootProfile, getStandardProfile } from './filter';
import { CreateProfileContext } from '../../service/api/profile/profile';
import { usePrevious } from '../../hook/usePrevious';
import { Identity, Profile, ProfileCategory, ProfileIdentity } from '../../service/api/profile/type';
import { AuthorizationError, AuthorizationErrorReason } from '../../type/error/AuthorizationError';
import equal from 'fast-deep-equal';
import { PropsWithErrorCapturing } from '../../type/provider/Props';

type Props = {
    locale?: string;
    pid?: string; // Default profileId
};

export const ProfileProvider: React.FC<PropsWithChildren<PropsWithErrorCapturing<Props>>> = ({ children, locale = 'en-HK', pid, capturing }) => {
    // Provider
    const { token } = useAuth();

    // State
    const [isReady, setReady] = useState(false);
    const [profiles, setStandardProfiles] = useState<Profile[]>();
    const [rootProfile, setRootProfile] = useState<Profile>();
    const [currentProfile, setCurrentProfile] = useState<Profile | undefined>();
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
                if (!token) throw new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized);
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
                await refreshProfiles();
                setCurrentProfile(newProfie);
                return newProfie;
            } catch (error) {
                capture(error);
                throw error;
            }
        },
        [capture, refreshProfiles, token],
    );

    const updateProfile = useCallback(
        async (profileId: string, category: ProfileCategory, refresh = true) => {
            try {
                if (!token) throw new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized);

                category.preference &&
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
                throw error;
            }
        },
        [capture, refreshProfiles, token],
    );

    const deleteProfile = useCallback(
        async (profileId: string) => {
            try {
                if (!token) throw new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized);
                await ProfileService.deleteRemoveProfile({ profileId: profileId }, token, ApiErrorHandler);
                await refreshProfiles();
            } catch (error) {
                capture(error);
                throw error;
            }
        },
        [capture, refreshProfiles, token],
    );

    const createTag = useCallback(
        async (profileId: string, tag: string, token: string) => {
            await ProfileService.postCreateTag(
                {
                    profileId,
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
        async (profileId: string, tag: string, token: string) => {
            await ProfileService.putUpdateTag(
                {
                    profileId,
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
        async (profileId: string, tagId: string, token: string) => {
            await ProfileService.deleteTag(
                {
                    profileId,
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
        async (profileId: string, identity: Identity, token: string) => {
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
        [refreshProfiles],
    );

    const updateIdentity = useCallback(
        async (profileId: string, profileIdentity: ProfileIdentity, token: string) => {
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
        [refreshProfiles],
    );

    const deleteIdentity = useCallback(
        async (profileId: string, identityId: string, token: string) => {
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
        [refreshProfiles],
    );

    // const createAddress = useCallback(
    //     async (profileId: string, address: Address) => {
    //         if (!token) throw new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized);
    //         await ProfileService.postCreateProfileAddress(
    //             {
    //                 profileId,
    //                 address,
    //             },
    //             token,
    //             ApiErrorHandler,
    //         );
    //         await refreshProfiles();
    //     },
    //     [refreshProfiles, token],
    // );

    // const updateQuestionnaire = useCallback(
    //     async (profileId: string, questionnaire: Questionnaire) => {
    //         if (!token) throw new AuthorizationError('Unauthorized', AuthorizationErrorReason.Unauthroized);

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
        if (profiles) {
            if (profiles.length === 0) {
                setCurrentProfile(undefined);
            } else {
                const cached = profiles.find(p => p.profileId === pid);
                if (cached) {
                    console.log('Set cached default profile: ', cached.profileId);
                    setCurrentProfile(cached);
                } else {
                    setCurrentProfile(current => {
                        const latestCurrent = profiles.find(p => p.profileId === current?.profileId);
                        if (current && latestCurrent && !equal(current, latestCurrent)) {
                            return latestCurrent;
                        }

                        if (!current) {
                            console.log('Set default profile: ', profiles[0].profileId);
                            return profiles[0];
                        }

                        return current;
                    });
                }
            }
        }
    }, [pid, profiles]);

    // Update locale for root profile whenever switch/login to an account
    useEffect(() => {
        if (rootProfile && prevRootProfile?.profileId !== rootProfile.profileId) {
            if (rootProfile.preference?.language !== locale) {
                console.log(`Update account language to ${locale}`);
                // Don't really care if it fails
                updateProfile(rootProfile.profileId, { preference: { language: locale } }).catch(error => capture(error));
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
            setCurrentProfile: async (profile?: Profile) => {
                if (rootProfile && profile && profiles) {
                    const target = profiles.find(p => p.profileId === profile.profileId);
                    if (target) {
                        console.log('Set curent profile: ', target.profileId);
                        setCurrentProfile(target);
                    }
                }
            },
            createProfile,
            updateProfile,
            deleteProfile,
            createTag,
            updateTag,
            deleteTag,
            createIdentity,
            updateIdentity,
            deleteIdentity,
            // createAddress,
        }),
        [isReady, profiles, rootProfile, currentProfile, createProfile, updateProfile, deleteProfile, createTag, updateTag, deleteTag, createIdentity, updateIdentity, deleteIdentity],
    );

    return <ProfileContext.Provider value={profileContext}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => useContext(ProfileContext);
