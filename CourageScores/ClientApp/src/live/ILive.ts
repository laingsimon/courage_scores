import { ILiveOptions } from './ILiveOptions.ts';
import { ISubscriptions } from './ISubscriptions.ts';
import { ISubscriptionRequest } from './ISubscriptionRequest.ts';
import { UntypedPromise } from '../interfaces/UntypedPromise.ts';

export interface ILive {
    liveOptions: ILiveOptions;
    enableLiveUpdates(
        enabled: boolean,
        request: ISubscriptionRequest,
    ): UntypedPromise;
    subscriptions: ISubscriptions;
}
