import React, {createContext, Ref, useContext} from "react";

export interface IButtonDropdown {
    isOpen?: boolean;
    toggle?: () => void;
}

export interface IButtonDropdownProps extends IButtonDropdown {
    ref?: Ref<HTMLDivElement>;
    children: React.ReactNode[];
    datatype?: string;
    className?: string;
}

export interface IDropdownMenuProps {
    children: React.ReactNode;
    className?: string;
}

export interface IDropdownToggleProps {
    color: string;
    children?: React.ReactNode;
    className?: string;
}

const ButtonDropdownContext = createContext({});

export function useButtonDropdown(): IButtonDropdown {
    return useContext(ButtonDropdownContext) as IButtonDropdown;
}

export function ButtonDropdown(props: IButtonDropdownProps) {
    const className = props.className
        ? ` ${props.className}`
        : '';

    return (<ButtonDropdownContext.Provider value={props}>
        <div ref={props.ref} className={`btn-group${className}${props.isOpen ? ' show' : ''}`} style={{ position: 'relative' }} datatype={props.datatype}>
            {props.children}
        </div>
    </ButtonDropdownContext.Provider>);
}

export function DropdownMenu({children, className}: IDropdownMenuProps) {
    const {isOpen, toggle} = useButtonDropdown();

    return (<div className={`position-absolute bottom-0 ${isOpen ? '' : ' d-none'}`} onClick={toggle}>
        <div tabIndex={-1}
             role="menu"
             className={`dropdown-menu${isOpen ? ' show' : ''} ${className || ''}`}
             data-popper-placement="bottom-start">
            {children}
        </div>
    </div>);
}

export function DropdownToggle({color, children, className}: IDropdownToggleProps) {
    const {toggle} = useButtonDropdown();

    return (<button type="button" className={`dropdown-toggle btn btn-${color} ${className}`} onClick={toggle} tabIndex={-1}>
        {children ? children : (<span className="visually-hidden">Toggle Dropdown</span>)}
    </button>);
}