import React, {createContext, useContext} from "react";
import {IAdmin} from "./IAdmin";

const AdminContext = createContext({});

export function useAdmin(): IAdmin {
    return useContext(AdminContext) as IAdmin;
}

export interface IAdminContainerProps extends IAdmin {
    children?: React.ReactNode;
}

/* istanbul ignore next */
export function AdminContainer({children, ...data}: IAdminContainerProps) {
    return (<AdminContext.Provider value={data}>
        {children}
    </AdminContext.Provider>)
}