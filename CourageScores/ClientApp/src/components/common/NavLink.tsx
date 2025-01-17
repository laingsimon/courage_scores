import React, {MouseEventHandler} from "react";
import {Link} from "react-router";

export interface INavLinkProps {
    className?: string;
    to: string;
    children: React.ReactNode;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function NavLink({className, to, children, onClick}: INavLinkProps) {
    return (<Link className={`${className} nav-link`} onClick={onClick} to={to}>
        {children}
    </Link>);
}