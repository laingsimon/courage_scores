import { IServerSideException } from './IServerSideException.ts';

export interface IServerSideError {
    Exception?: IServerSideException;
}
