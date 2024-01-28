export interface ISubscription {
    id: string,
    updateHandler: (data: any) => void,
    errorHandler: (error: any) => void,
}
