export interface IFailedRequest {
    status?: number;
    body?: any;
    errors?: { [key: string]: string[] };
    text?: () => Promise<string>;
    json?: () => Promise<any>;
    title?: string;
}