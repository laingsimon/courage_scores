export interface IFullScreen {
    isFullScreen?: boolean;
    canGoFullScreen?: boolean;
    enterFullScreen(): Promise<void>;
    exitFullScreen(): Promise<void>;
    toggleFullScreen(): Promise<void>;
}