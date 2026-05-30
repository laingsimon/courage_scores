import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface IFullScreen {
    isFullScreen?: boolean;
    canGoFullScreen?: boolean;
    enterFullScreen(element?: HTMLElement | null): UntypedPromise;
    exitFullScreen(): UntypedPromise;
    toggleFullScreen(): UntypedPromise;
}
