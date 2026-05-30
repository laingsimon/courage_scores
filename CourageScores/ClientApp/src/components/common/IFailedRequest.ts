import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface IFailedRequest {
    status?: number;
    body?: any;
    errors?: { [key: string]: string[] };
    text?(): Promise<string>;
    json?(): UntypedPromise;
    title?: string;
}
