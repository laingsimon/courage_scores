import {IActionResultDto} from "./serverSide/IActionResultDto";
// NOTE: This adds in the extra properties that are exposed by the fetch() API
// https://developer.mozilla.org/en-US/docs/Web/API/Response

export interface IClientActionResultDto<TDto> extends IActionResultDto<TDto> {
    body?: any;
    status?: number;
    text?: () => Promise<string>;
    json?: () => Promise<any>;
    title?: string;
}