import React, {useState} from 'react';
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";

export function BootstrapDropdown({value, onChange, options, color, className, disabled, readOnly, onOpen }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    if (options.length === 0) {
        return (<button className={`btn btn-sm btn-${color || 'light'} dropdown-toggle`} disabled>&nbsp;</button>)
    }

    const selectedOption = options.filter(o => o.value === value)[0];

    if (disabled) {
        return selectedOption
            ? (<button className={`btn btn-sm btn-${color || 'light'} dropdown-toggle`} disabled>{selectedOption.text}</button>)
            : (<button className={`btn btn-sm btn-${color || 'light'} dropdown-toggle`} disabled></button>)
    }

    function toggleOpen() {
        if (!readOnly) {
            const willBeOpen = !dropdownOpen;
            setDropdownOpen(willBeOpen);
            if (onOpen) {
                onOpen(willBeOpen);
            }
        }
    }

    return (<ButtonDropdown isOpen={dropdownOpen} toggle={toggleOpen} className={className}>
        <DropdownToggle caret color={color || 'outline-light'} className="btn-sm text-dark border-dark">
            <span className="text-dark dropdown-text-min-width">{selectedOption ? selectedOption.text || value : value}</span>
        </DropdownToggle>
        <DropdownMenu>
            {options.map(o => (<DropdownItem key={o.value}
                                             disabled={o.disabled || false}
                                             className={o.value === value ? 'active' : ''}
                onClick={() => onChange(o.value)}>{o.text}</DropdownItem>))}
        </DropdownMenu>
    </ButtonDropdown>);
}
