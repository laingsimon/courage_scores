import {ReactElement} from "react";

export interface ILayoutDataForSide {
    id: string;
    name: string;
    link: ReactElement;
    mnemonic?: string;
    showMnemonic?: boolean;
}