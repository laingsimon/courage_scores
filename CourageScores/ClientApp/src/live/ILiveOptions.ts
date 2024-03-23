import {ISubscriptionRequest} from "./ISubscriptionRequest";

export interface ILiveOptions {
    publish?: boolean,
    canSubscribe?: boolean,
    subscribeAtStartup?: ISubscriptionRequest[],
}
