import { hasKeys, validateArray, validateBoolean, validateEnum, validateNumber, validateOptionalString, validateString } from '../validation';

describe('@hasKeys', () => {
    test('truthy', () => {
        const apple = { apple: 'tree' };
        const orange = { orange: 'tart', apple: 'tree' };
        const bananna = { bananna: 'candy', ...orange };
        expect(hasKeys(apple, ['apple'])).toBeTruthy();
        expect(hasKeys(orange, ['orange', 'apple'])).toBeTruthy();
        expect(hasKeys(bananna, ['apple', 'orange'])).toBeTruthy();
        expect(hasKeys(bananna, [])).toBeTruthy();
    });

    test('falsy', () => {
        const apple = { apple: 'tree' };
        const orange = { orange: 'tart', apple: 'tree' };
        const bananna = { bananna: 'candy', ...orange };
        expect(hasKeys(apple, ['orange'])).toBeFalsy();
        expect(hasKeys(orange, ['orange', 'bananna'])).toBeFalsy();
        expect(hasKeys(bananna, ['random'])).toBeFalsy();
    });
});

describe('@validateString', () => {
    test('valid', () => {
        expect(validateString('123456')).toEqual('123456');
        expect(validateString('')).toEqual('');
    });

    test('invalid', () => {
        expect(() => validateString(3)).toThrow(Error);
        expect(() => validateString(true)).toThrow(Error);
        expect(() => validateString(undefined)).toThrow(Error);
        expect(() => validateString(null)).toThrow(Error);
        expect(() => validateString([3, 'asdf'])).toThrow(Error);
        expect(() => validateString({ 3: 'asdf' })).toThrow(Error);
    });
});

describe('@validateNumber', () => {
    test('valid', () => {
        expect(validateNumber(3)).toEqual(3);
        expect(validateNumber(13.3)).toEqual(13.3);
    });

    test('invalid', () => {
        expect(() => validateNumber('123456')).toThrow(Error);
        expect(() => validateNumber('')).toThrow(Error);
        expect(() => validateNumber(true)).toThrow(Error);
        expect(() => validateNumber(undefined)).toThrow(Error);
        expect(() => validateNumber(null)).toThrow(Error);
        expect(() => validateNumber([3, 'asdf'])).toThrow(Error);
        expect(() => validateNumber({ 3: 'asdf' })).toThrow(Error);
    });
});

describe('@validateBoolean', () => {
    test('valid', () => {
        expect(validateBoolean(true)).toEqual(true);
        expect(validateBoolean(false)).toEqual(false);
    });

    test('invalid', () => {
        expect(() => validateBoolean('123456')).toThrow(Error);
        expect(() => validateBoolean('')).toThrow(Error);
        expect(() => validateBoolean(3)).toThrow(Error);
        expect(() => validateBoolean(3.13)).toThrow(Error);
        expect(() => validateBoolean(1)).toThrow(Error);
        expect(() => validateBoolean([3, 'asdf'])).toThrow(Error);
        expect(() => validateBoolean({ 3: 'asdf' })).toThrow(Error);
        expect(() => validateBoolean(undefined)).toThrow(Error);
        expect(() => validateBoolean(null)).toThrow(Error);
    });
});

describe('@validateOptionalString', () => {
    test('valid', () => {
        expect(validateOptionalString('123456')).toEqual('123456');
        expect(validateOptionalString('')).toEqual('');
    });

    test('undefined', () => {
        expect(validateOptionalString(3)).toEqual(undefined);
        expect(validateOptionalString(true)).toEqual(undefined);
        expect(validateOptionalString([3, 'asdf'])).toEqual(undefined);
        expect(validateOptionalString({ 3: 'asdf' })).toEqual(undefined);
        expect(validateOptionalString(undefined)).toEqual(undefined);
        expect(validateOptionalString(null)).toEqual(undefined);
    });
});

describe('@validateEnum', () => {
    enum Direction {
        Up = 'UP',
        Down = 'DOWN',
        Left = 'LEFT',
        Right = 'RIGHT',
    }

    test('valid', () => {
        expect(validateEnum<Direction>(Direction.Up, [Direction.Up, Direction.Down])).toEqual('UP');
        expect(validateEnum<Direction>('UP', [Direction.Up, Direction.Down])).toEqual('UP');
    });

    test('invalid', () => {
        expect(() => validateEnum<Direction>(Direction.Up, [Direction.Down])).toThrow(Error);
        expect(() => validateEnum<Direction>('UP', [Direction.Down])).toThrow(Error);
        expect(() => validateEnum<Direction>(Direction.Up, [])).toThrow(Error);
    });
});

describe('@validateArray', () => {
    test('valid', () => {
        expect(validateArray<unknown>(['123456', 3, true], e => e)).toEqual(['123456', 3, true]);
        expect(validateArray<unknown>(['123456', 3, true], () => {})).toEqual([undefined, undefined, undefined]);
        expect(validateArray<unknown>(['123456', '3', 'true'], validateString)).toEqual(['123456', '3', 'true']);
        expect(validateArray<string>(['123456', '3', 'true'], validateString)).toEqual(['123456', '3', 'true']);
        expect(validateArray<boolean>([true, false, false], validateBoolean)).toEqual([true, false, false]);
        expect(validateArray<number>([3, 4.1], validateNumber)).toEqual([3, 4.1]);
        expect(validateArray<string | undefined>(['asdf', 4.1], validateOptionalString)).toEqual(['asdf', undefined]);
    });

    test('valid', () => {
        expect(() => validateArray<unknown>(true, e => e)).toThrow(Error);
        expect(() => validateArray<unknown>(1, e => e)).toThrow(Error);
        expect(() => validateArray<unknown>('asdf', e => e)).toThrow(Error);
        expect(() => validateArray<unknown>({ apple: 'tree' }, e => e)).toThrow(Error);
        expect(() => validateArray<unknown>(null, e => e)).toThrow(Error);
        expect(() => validateArray<unknown>(undefined, e => e)).toThrow(Error);
    });
});
