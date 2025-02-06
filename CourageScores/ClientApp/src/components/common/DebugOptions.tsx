import {ButtonDropdown, DropdownMenu, DropdownToggle} from "./ButtonDropdown";
import React, {useState} from "react";
import {useApp} from "./AppContainer";

export interface IDebugOptionsProps {
    children: React.ReactNode;
}

export function DebugOptions({ children }: IDebugOptionsProps) {
    const [open, setOpen] = useState<boolean>(false);
    const {account} = useApp();

    const canDisplay: boolean = !!(account && account.access && account.access.showDebugOptions);
    if (!canDisplay) {
        return null;
    }

    return (<ButtonDropdown isOpen={open} toggle={() => setOpen(!open)} datatype="debug-options">
        <DropdownToggle color="info">
            Debug options
        </DropdownToggle>
        <DropdownMenu>
            {children}
        </DropdownMenu>
    </ButtonDropdown>);
}