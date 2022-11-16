import React, {useState} from 'react';
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";

export function TeamSelection({value, onChange, options, color}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    if (options.length === 0) {
        return (<button className={`btn btn-${color || 'light'}`} disabled></button>)
    }

    if (options.length === 1) {
        return (<button className={`btn btn-${color || 'light'}`} disabled>{options[0].text}</button>)
    }

    const selectedOption = options.filter(o => o.value === value)[0];

    return (<ButtonDropdown isOpen={dropdownOpen} toggle={() => setDropdownOpen(!dropdownOpen)}>
        <DropdownToggle caret color={color || 'light'}>
            {selectedOption ? selectedOption.text : value}
        </DropdownToggle>
        <DropdownMenu>
            {options.map(o => (<DropdownItem key={o.value}
                                             className={o.value === value ? 'active' : ''}
                onClick={() => onChange(o.value)}>{o.text}</DropdownItem>))}
        </DropdownMenu>
    </ButtonDropdown>);
}
