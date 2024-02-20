import {LiveDataType} from "./LiveDataType";

export interface ISubscriptionRequest {
    id: string;
    type: LiveDataType;
}