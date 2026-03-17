import { ButtonDropdown, DropdownMenu, DropdownToggle } from './ButtonDropdown';
import React, { useState } from 'react';
import { useApp } from './AppContainer';

export interface IDebugOptionsProps {
    text?: string;
    children: React.ReactNode;
    direction?: 'up' | 'down';
    className?: string;
}

export function DebugOptions({
    children,
    text,
    direction,
    className,
}: IDebugOptionsProps) {
    const [open, setOpen] = useState<boolean>(false);
    const { account } = useApp();

    const canDisplay: boolean = !!(
        account &&
        account.access &&
        account.access.showDebugOptions
    );
    if (!canDisplay) {
        return null;
    }

    return (
        <ButtonDropdown
            isOpen={open}
            toggle={() => setOpen(!open)}
            datatype="debug-options"
            direction={direction}>
            <DropdownToggle color="info" className={className}>
                {text ?? 'Debug options'}
            </DropdownToggle>
            <DropdownMenu>{children}</DropdownMenu>
        </ButtonDropdown>
    );
}
