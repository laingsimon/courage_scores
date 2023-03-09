import { createContext, useContext } from "react";

const DependenciesContext = createContext({
   initialContainerValue: 'Dependencies.js'
});

export function useDependencies() {
    return useContext(DependenciesContext);
}

export function IocContainer({ children, ...services }) {
    return (<DependenciesContext.Provider value={services}>
        {children}
    </DependenciesContext.Provider>)
}