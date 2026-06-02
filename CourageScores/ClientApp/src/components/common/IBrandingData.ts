import { IMenuItem } from '../layout/IMenuItem.ts';

export interface IBrandingData {
    name: string;
    email?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
    custodians?: string[];
    menu?: {
        beforeDivisions: IMenuItem[];
        afterDivisions: IMenuItem[];
    };
}
