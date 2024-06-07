import {IBrandingData} from "./IBrandingData";

export interface IBranding extends IBrandingData {
    setTitle(newTitle?: string): void;
}