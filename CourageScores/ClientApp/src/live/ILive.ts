import {ILiveOptions} from "./ILiveOptions";
import {ISubscriptions} from "./ISubscriptions";
import {ISubscriptionRequest} from "./ISubscriptionRequest";
import {UntypedPromise} from "../interfaces/UntypedPromise";

export interface ILive {
    liveOptions: ILiveOptions;
    enableLiveUpdates(enabled: boolean, request: ISubscriptionRequest): UntypedPromise;
    subscriptions: ISubscriptions;
}