import {UserDto} from "../interfaces/models/dtos/Identity/UserDto";
import {IError} from "../components/common/IError";
import {ErrorDetailDto} from "../interfaces/models/dtos/ErrorDetailDto";
import {createTemporaryId} from "./projection";

export function mapError(error: string | IError): IError {
    const errorObject: IError = error as IError;
    if (errorObject.stack) {
        console.error(error);
    }
    if (errorObject.message) {
        return {message: errorObject.message, stack: errorObject.stack};
    }

    return {message: error as string};
}

export function mapForLogging(error: IError, account?: UserDto): ErrorDetailDto {
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
        id: createTemporaryId(),
    }
}
