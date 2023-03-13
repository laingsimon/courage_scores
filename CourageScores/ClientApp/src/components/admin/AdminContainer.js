import { createContext, useContext } from "react";
const AdminContext = createContext({});

export function useAdmin() {
    return useContext(AdminContext);
}

export function AdminContainer({ children, ...data }) {
    return (<AdminContext.Provider value={data}>
        {children}
    </AdminContext.Provider>)
}