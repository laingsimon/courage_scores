import { createContext, useContext } from "react";
const AppContext = createContext({});

export function useApp() {
    return useContext(AppContext);
}

export function AppContainer({ children, ...data }) {
    return (<AppContext.Provider value={data}>
        {children}
    </AppContext.Provider>)
}