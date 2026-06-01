import { TextDecoder, TextEncoder } from 'util';
import { jest } from '@jest/globals';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.jest = jest;

jest.unstable_mockModule('react-router', () => {
    const originalModule = jest.requireActual('react-router');
    const mockedUseNavigate = jest.fn();

    return {
        ...originalModule,
        useNavigate: () => mockedUseNavigate,
    };
});
