import {ILiveOptions} from "./ILiveOptions";
import {ISubscriptions} from "./ISubscriptions";

export interface ILive {
    liveOptions: ILiveOptions;
    enableLiveUpdates: (enabled: boolean, id: string) => Promise<any>;
    subscriptions: ISubscriptions;
    connected: boolean;
}