import { ISubscriptionRequest } from './ISubscriptionRequest.ts';

export interface ILiveOptions {
    publish?: boolean;
    canSubscribe?: boolean;
    subscribeAtStartup?: ISubscriptionRequest[];
}
