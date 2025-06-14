import { UntypedPromise } from '../../interfaces/UntypedPromise';

export interface IFullScreen {
    isFullScreen?: boolean;
    canGoFullScreen?: boolean;
    enterFullScreen(element?: HTMLElement | null): UntypedPromise;
    exitFullScreen(): UntypedPromise;
    toggleFullScreen(): UntypedPromise;
}
