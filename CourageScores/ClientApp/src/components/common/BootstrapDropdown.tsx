import {useState} from 'react';
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import {isEmpty} from "../../helpers/collections";

export interface IBootstrapDropdownItem {
    value: any;
    text?: any;  // Element | string
    collapsedText?: string;
    disabled?: boolean;
    className?: string;
}

export interface IBootstrapDropdownProps {
    value?: any;
    options?: IBootstrapDropdownItem[];
    color?: string;
    className?: string;
    disabled?: boolean;
    readOnly?: boolean;
    onChange?(value: any): Promise<any>;
    onOpen?(willBeOpen: boolean): Promise<any>;
    slim?: boolean;
    datatype?: string;
}

export function BootstrapDropdown({value, onChange, options, color, className, disabled, readOnly, onOpen, slim, datatype}: IBootstrapDropdownProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

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
        <DropdownToggle caret color={color || 'outline-light'} className="btn-sm text-dark border-dark" tabIndex={-1}>
            <span
                className={`text-dark${slim ? '' : ' dropdown-text-min-width'}`}>{selectedOption ? (selectedOption.collapsedText || selectedOption.text) || value : value}</span>
        </DropdownToggle>
        <DropdownMenu className="max-height-250 overflow-auto">
            {options.map((o: IBootstrapDropdownItem) => (<DropdownItem key={o.value}
                                                                       disabled={o.disabled || false}
                                                                       className={getItemClassName(o)}
                                                                       onClick={async () => onChange ? await onChange(o.value) : null}>{o.text || o.value}</DropdownItem>))}
        </DropdownMenu>
    </ButtonDropdown>);
}
