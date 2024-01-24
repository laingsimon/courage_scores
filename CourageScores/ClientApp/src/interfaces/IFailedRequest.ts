export interface IFailedRequest {
    status: any;
    errors: { [key: string]: string };
}