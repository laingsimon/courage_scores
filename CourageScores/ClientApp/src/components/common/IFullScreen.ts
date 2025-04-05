export interface IFullScreen {
    isFullScreen?: boolean;
    canGoFullScreen?: boolean;
    enterFullScreen(element?: HTMLElement | null): Promise<void>;
    exitFullScreen(): Promise<void>;
    toggleFullScreen(): Promise<void>;
}