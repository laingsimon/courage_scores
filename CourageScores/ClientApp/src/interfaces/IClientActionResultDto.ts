import {IActionResultDto} from "./dtos/IActionResultDto";
import {IFailedRequest} from "./IFailedRequest";
// NOTE: This adds in the extra properties that are exposed by the fetch() API
// https://developer.mozilla.org/en-US/docs/Web/API/Response

// TOOD: Find a way of removing the @ts-ignore below
// @ts-ignore
export interface IClientActionResultDto<TDto> extends IActionResultDto<TDto>, IFailedRequest {

}