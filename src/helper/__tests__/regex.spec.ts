import { ValidationRegex } from '../regex';

const validUser = {
    firstName: 'John',
    lastName: 'Doe',
    phone: '87654321',
    countryCode: '852',
    email: 'john.doe@prenetics.com',
    addressLine1: 'Shop LA303, 3/F',
    addressLine2: 'K11 Musea, Tsim Sha Tsui, HK',
    district: 'Hong Kong',
    city: 'Hong Kong',
    province: '',
    country: 'Hong Kong',
    postalCode: '624302',
};

const invalidName = {
    withSpecialCharacter: 'John$',
    withNumberAndCharacter: 'John123',
    withNonEnglishCharacter: 'John€',
    withSmiley: 'John 😁',
};

const invalidEmail = {
    withOutDomainName: 'john.doe@.com',
    withOutAtSymbol: 'john.doeprenetics.com',
    withOutDotCom: 'john.doe@prenetics',
};

const invalidAddress = {
    withNonEnglishCharacter: 'Shop LA303, 3/F !',
};

describe('Regex Name Field Validation', () => {
    it('should name have a correct format', () => {
        const nameRegex = ValidationRegex.ValidName;
        expect(validUser.firstName.match(nameRegex)).toBeTruthy();
    });

    it('should name does not contain special character', () => {
        const nameRegex = ValidationRegex.ValidName;
        expect(invalidName.withSpecialCharacter.match(nameRegex)).toBeFalsy();
    });

    it('should name does not contain number and special character', () => {
        const nameRegex = ValidationRegex.ValidName;
        expect(invalidName.withNumberAndCharacter.match(nameRegex)).toBeFalsy();
    });

    it('should name does not contain non english character', () => {
        const nameRegex = ValidationRegex.ValidName;
        expect(invalidName.withNonEnglishCharacter.match(nameRegex)).toBeFalsy();
    });

    it('should name does not contain smiley character', () => {
        const nameRegex = ValidationRegex.ValidName;
        expect(invalidName.withSmiley.match(nameRegex)).toBeFalsy();
    });
});

describe('Regex Email Validation', () => {
    it('should email have correct format', () => {
        const emailRegx = ValidationRegex.ValidEmail;
        expect(validUser.email.match(emailRegx)).toBeTruthy();
    });

    it('should email contain domain name', () => {
        const emailRegx = ValidationRegex.ValidEmail;
        expect(invalidEmail.withOutDomainName.match(emailRegx)).toBeFalsy();
    });
});

describe('Regex Address Validation', () => {
    it('should address have a correct format', () => {
        const addressRegx = ValidationRegex.ValidAddress;
        expect(validUser.addressLine1.match(addressRegx)).toBeTruthy();
    });

    it('should address does not have non english character', () => {
        const addressRegx = ValidationRegex.ValidAddress;
        expect(invalidAddress.withNonEnglishCharacter.match(addressRegx)).toBeFalsy();
    });
});
