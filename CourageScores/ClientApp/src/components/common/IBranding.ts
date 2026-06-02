import { IBrandingData } from './IBrandingData.ts';

export interface IBranding extends IBrandingData {
    setTitle(newTitle?: string): void;
}
