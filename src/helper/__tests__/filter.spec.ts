import { filterByValues } from '../filter';

describe('@filterByAcceptedEnum', () => {
    test('valid', () => {
        expect(filterByValues<string>(['123456', '234567'], ['123456'])).toEqual(['123456']);
        expect(filterByValues<string>(['123456', '234567'], [])).toEqual([]);
        expect(filterByValues<string>([], ['123456'])).toEqual([]);
        expect(filterByValues<string>([], [])).toEqual([]);
    });

    test('error', () => {
        expect(() => filterByValues<string>(1, ['123456'])).toThrow(Error);
        expect(() => filterByValues<string>('1', ['123456'])).toThrow(Error);
        expect(() => filterByValues<string>(undefined, ['123456'])).toThrow(Error);
        expect(() => filterByValues<string>(null, ['123456'])).toThrow(Error);
        expect(() => filterByValues<string>({ apple: 'tree' }, ['123456'])).toThrow(Error);
    });
});
