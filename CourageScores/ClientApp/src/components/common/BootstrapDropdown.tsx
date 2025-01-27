import {useState} from 'react';
import {ButtonDropdown, DropdownMenu, DropdownToggle} from "./ButtonDropdown";
import {isEmpty} from "../../helpers/collections";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface IBootstrapDropdownItem {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    value: any;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    text?: any;  // Element | string
    collapsedText?: string;
    disabled?: boolean;
    className?: string;
}

export interface IBootstrapDropdownProps {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    value?: any;
    options?: IBootstrapDropdownItem[];
    color?: string;
    className?: string;
    disabled?: boolean;
    readOnly?: boolean;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    onChange?(value: any): UntypedPromise;
    onOpen?(willBeOpen: boolean): UntypedPromise;
    slim?: boolean;
    datatype?: string;
}

export function BootstrapDropdown({value, onChange, options, color, className, disabled, readOnly, onOpen, slim, datatype}: IBootstrapDropdownProps) {
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

    if (!options || isEmpty(options)) {
        return (<button className={`btn btn-sm btn-${color || 'light'} dropdown-toggle`} disabled>&nbsp;</button>)
    }

    const selectedOption = options.filter(o => o.value === value)[0];

    if (disabled) {
        return selectedOption
            ? (<button className={`btn btn-sm btn-${color || 'light'} dropdown-toggle`} disabled>
                {selectedOption.collapsedText || selectedOption.text}
            </button>)
            : (<button className={`btn btn-sm btn-${color || 'light'} dropdown-toggle`} disabled></button>)
    }

    async function toggleOpen() {
        if (!readOnly) {
            const willBeOpen = !dropdownOpen;
            setDropdownOpen(willBeOpen);
            if (onOpen) {
                await onOpen(willBeOpen);
            }
        }
    }

    function getItemClassName(o: IBootstrapDropdownItem) {
        return o.value === value
            ? `active ${o.className || ''}`
            : o.className || '';
    }

    return (<ButtonDropdown isOpen={dropdownOpen} toggle={toggleOpen} className={className} datatype={datatype}>
        <DropdownToggle color={color || 'outline-light'} className="btn-sm text-dark border-dark">
            <span
                className={`text-dark${slim ? '' : ' dropdown-text-min-width'}`}>{selectedOption ? (selectedOption.collapsedText || selectedOption.text) || value : value}</span>
        </DropdownToggle>
        <DropdownMenu className="max-height-250 overflow-auto">
            {options.map((o: IBootstrapDropdownItem) => (<button key={o.value}
                                                                       disabled={o.disabled || false}
                                                                       role="menuitem"
                                                                       className={`dropdown-item ${getItemClassName(o)}`}
                                                                       onClick={async () => onChange ? await onChange(o.value) : null}>{o.text || o.value}</button>))}
        </DropdownMenu>
    </ButtonDropdown>);
}