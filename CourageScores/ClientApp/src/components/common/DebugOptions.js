import {ButtonDropdown, DropdownMenu, DropdownToggle} from "reactstrap";
import React, {useState} from "react";
import {useApp} from "../../AppContainer";

export function DebugOptions({ children }) {
    const [open, setOpen] = useState(false);
    const {account} = useApp();

    const canDisplay = account && account.access && account.access.showDebugOptions;
    if (!canDisplay) {
        return null;
    }

    return (<ButtonDropdown isOpen={open} toggle={() => setOpen(!open)}>
        <DropdownToggle caret color="info">
            Debug options
        </DropdownToggle>
        <DropdownMenu>
            {children}
        </DropdownMenu>
    </ButtonDropdown>);
}