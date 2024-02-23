import {LiveDataType} from "../interfaces/models/dtos/Live/LiveDataType";

export interface ISubscriptionRequest {
    id: string;
    type: LiveDataType;
}