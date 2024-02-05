import React, {createContext, useContext} from "react";
import {IBranding} from "./IBranding";

const BrandingContext = createContext({});

export function useBranding(): IBranding {
    return useContext(BrandingContext) as IBranding;
}

export interface IBrandingContainerProps extends IBranding {
    children?: React.ReactNode;
}

/* istanbul ignore next */
export function BrandingContainer({children, ...data}: IBrandingContainerProps) {
    return (<BrandingContext.Provider value={data}>
        {children}
    </BrandingContext.Provider>)
}