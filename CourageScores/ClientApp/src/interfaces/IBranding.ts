import {IMenuItem} from "./IMenuItem";

export interface IBranding {
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
