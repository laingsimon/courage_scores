import { createContext, useContext } from "react";
const BrandingContext = createContext({});

export function useBranding() {
    return useContext(BrandingContext);
}

/* istanbul ignore next */
export function BrandingContainer({ children, ...data }) {
    return (<BrandingContext.Provider value={data}>
        {children}
    </BrandingContext.Provider>)
}