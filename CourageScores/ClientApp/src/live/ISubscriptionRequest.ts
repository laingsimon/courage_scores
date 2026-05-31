import { LiveDataType } from '../interfaces/models/dtos/Live/LiveDataType.ts';

export interface ISubscriptionRequest {
    id: string;
    type: LiveDataType;
}
