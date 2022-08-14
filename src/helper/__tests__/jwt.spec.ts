import jwt from 'jsonwebtoken';
import { isActive } from '../jwt';

describe('@jwt', () => {
    describe('@isActive', () => {
        it('future exp should return active', () => {
            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) + 60 * 60,
                    data: 'foobar',
                },
                'secret',
            );
            expect(isActive(token)).toBeTruthy();
        });

        it('pass exp should return inactive', () => {
            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) - 60 * 60,
                    data: 'foobar',
                },
                'secret',
            );
            expect(isActive(token)).toBeFalsy();
        });

        it('no exp should return undefined', () => {
            const token = jwt.sign(
                {
                    data: 'foobar',
                },
                'secret',
            );
            expect(isActive(token)).toBeUndefined();
        });

        it('invalid token should return undefined', () => {
            expect(isActive('random')).toBeUndefined();
        });
    });
});
