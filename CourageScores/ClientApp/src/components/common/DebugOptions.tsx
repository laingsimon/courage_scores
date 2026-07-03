import {
    ButtonDropdown,
    DropdownMenu,
    DropdownToggle,
} from './ButtonDropdown.tsx';
import React, { useState } from 'react';
import { useApp } from './AppContainer.tsx';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';
import { hasAccess } from '../../helpers/conditions.ts';

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

    const canDisplay: boolean = hasAccess(
        account,
        AccessOption.showDebugOptions,
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
