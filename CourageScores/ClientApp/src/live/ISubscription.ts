import {LiveDataType} from "./LiveDataType";

export interface ISubscription {
    id: string,
    type: LiveDataType,
    method?: 'websocket' | 'polling',
    updateHandler: (data: any) => void,
    errorHandler: (error: any) => void,
}
