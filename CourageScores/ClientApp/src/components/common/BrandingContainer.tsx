import React, {createContext, useContext} from "react";
import {IBrandingData} from "./IBrandingData";
import {IBranding} from "./IBranding";

const BrandingContext = createContext({});

export function useBranding(): IBranding {
    return useContext(BrandingContext) as IBranding;
}

export interface IBrandingContainerProps extends IBrandingData {
    children?: React.ReactNode;
}

/* istanbul ignore next */
export function BrandingContainer({children, ...data}: IBrandingContainerProps) {
    function setTitle(newTitle?: string) {
        document.title = newTitle
            ? `${newTitle} - ${data.name}`
            : data.name;
    }

    const branding: IBranding = Object.assign({ setTitle }, data);
    return (<BrandingContext.Provider value={branding}>
        {children}
    </BrandingContext.Provider>)
}