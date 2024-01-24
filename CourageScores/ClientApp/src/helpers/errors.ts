import {IUserDto} from "../interfaces/serverSide/Identity/IUserDto";
import {IError} from "../interfaces/IError";

export function mapError(error: any): IError {
    if (error.stack) {
        console.error(error);
    }
    if (error.message) {
        return {message: error.message, stack: error.stack};
    }

    return {message: error};
}

export function mapForLogging(error: any, account?: IUserDto | null) {
    // noinspection JSUnresolvedReference
    const userAgent = window.navigator.userAgent;

    return {
        source: 'UI',
        time: new Date().toISOString(),
        message: error.message,
        stack: error.stack ? error.stack.split('\n') : null,
        type: error.type || null,
        userName: account ? account.name : null,
        userAgent: userAgent,
        url: window.location.href,
    };
}