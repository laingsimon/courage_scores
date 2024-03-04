import {ILiveOptions} from "./ILiveOptions";
import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";

export interface ILive {
    liveOptions: ILiveOptions;
    enableLiveUpdates(enabled: boolean, request: ISubscriptionRequest): Promise<any>;
    subscriptions: ISubscriptions;
}