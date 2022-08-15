import { AxiosError, AxiosResponse } from 'axios';
import { ApiErrorHandler } from '../handler';
import jwt from 'jsonwebtoken';
import { mock } from 'jest-mock-extended';
import { AuthorizationError } from '../../type/error/AuthorizationError';
import { UnexpectedError } from '../../type/error/UnexpectedError';

describe('@ApiErrorHandler', () => {
    test('generic axios error', () => {
        // Arrange
        const error = new AxiosError('Bad Request', '400');

        // Act + Assert
        expect(() => ApiErrorHandler(error)).toThrow(AxiosError);
        expect(() => ApiErrorHandler(error)).toThrow('Bad Request');
    });

    describe('401 unauthorized', () => {
        test('valid auth token', () => {
            // Arrange
            const error = new AxiosError('Unauthorized', '401', { headers: { Authorization: `Bearer AUTH_TOKEN` } });

            // Act + Assert
            expect(() => ApiErrorHandler(error)).toThrow(AxiosError);
            expect(() => ApiErrorHandler(error)).toThrow('Unauthorized');
        });

        test('expired token', () => {
            // Arrange
            const token = jwt.sign(
                {
                    exp: Math.floor(Date.now() / 1000) - 60 * 60,
                    data: 'foobar',
                },
                'secret',
            );
            const error = new AxiosError('Unauthorized', '401', { headers: { Authorization: `Bearer ${token}` } }, undefined, mock<AxiosResponse>({ status: 401 }));

            // Act + Assert
            expect(() => ApiErrorHandler(error)).toThrow(AuthorizationError);
            expect(() => ApiErrorHandler(error)).toThrow('Session Expired');
        });
    });

    describe('unexpected error', () => {
        // Arrange
        const error = new Error('Network Error');

        // Act + Assert
        test('generic error', () => {
            expect(() => ApiErrorHandler(error)).toThrow(UnexpectedError);
            expect(() => ApiErrorHandler(error)).toThrow('Unexpected API Error');
        });
    });
});
