import { DeleteProfileContext, CreateProfileContext } from '../../../../service/api/profile/profile';
import { Profile, Ethnicity, Gender } from '../../../../service/api/profile/type';

export const stubRootProfile: Profile = {
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

export const stubRootProfileWithoutLanguage: Profile = {
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
};

export const stubProfile: Profile = {
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
    email: [
        {
            name: 'stub.staff@prenetics.com',
            email: 'stub.staff@prenetics.com',
            primary: true,
            datetime: '2022-08-16T19:57:46.573Z',
        },
    ],
    tag: [],
    preference: { language: 'en-HK', preferenceId: 'c0c1c4c4-9273-4b74-ac29-b9d600082020' },
    phone: [{ number: '98765432', countryCode: 'hk', name: 'xPhone', datetime: '2022-01-08T19:57:46.573Z' }],
};

export const stubProfile_JohnD: Profile = {
    profileId: '65185B6C-E311-4ACA-9FE5-9337A4B8C6CA',
    owner: 'circle',
    root: false,
    name: { firstName: 'John', lastName: 'D' },
    email: [
        {
            name: 'john.d@prenetics.com',
            email: 'john.d@prenetics.com',
            primary: true,
            datetime: '2022-01-08T19:57:46.573Z',
        },
    ],
};

export const stubProfile_JaneB: Profile = {
    profileId: '6978E6BC-176F-48B2-98DA-13A26DC1A63D',
    owner: 'circle',
    root: false,
    name: { firstName: 'Jane', lastName: 'B' },
    email: [
        {
            name: 'jane.b@prenetics.com',
            email: 'jane.b@prenetics.com',
            primary: true,
            datetime: '2022-01-08T20:57:46.573Z',
        },
    ],
};

export const stubDeleteProfileContext: DeleteProfileContext = {
    profileId: '28264924-25a6-4d65-be8a-6ba4d598b3d3',
};

export const stubCreateProfileContext: CreateProfileContext = {
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
