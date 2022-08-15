import jwt from 'jsonwebtoken';
import { getRoles, getUserId, isActive, Role } from '../jwt';

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

    describe('@getUserId', () => {
        it('valid uid', () => {
            const token = jwt.sign(
                {
                    uid: '2d8cb1f6-39cb-4076-afe3-bfe0813db6c4',
                },
                'secret',
            );
            expect(getUserId(token)).toEqual('2d8cb1f6-39cb-4076-afe3-bfe0813db6c4');
        });

        it('invalid token should return undefined', () => {
            expect(getUserId('random')).toBeUndefined();
        });
    });

    describe('@getRoles', () => {
        it('valid roles', () => {
            const token = jwt.sign(
                {
                    roles: [Role.CustomerUser],
                },
                'secret',
            );
            expect(getRoles(token)).toEqual([Role.CustomerUser]);
        });

        it('invalid token should return undefined', () => {
            expect(getRoles('random')).toBeUndefined();
        });
    });
});
