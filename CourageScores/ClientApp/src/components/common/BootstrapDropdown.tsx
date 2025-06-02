import { ReactElement, useEffect, useRef, useState } from 'react';
import { ButtonDropdown, DropdownMenu, DropdownToggle } from './ButtonDropdown';
import { isEmpty } from '../../helpers/collections';
import { UntypedPromise } from '../../interfaces/UntypedPromise';

export interface IBootstrapDropdownItem {
    value?: string;
    text?: string | ReactElement;
    collapsedText?: string;
    disabled?: boolean;
    className?: string;
}

export interface IBootstrapDropdownProps {
    value?: string;
    options?: IBootstrapDropdownItem[];
    color?: string;
    className?: string;
    disabled?: boolean;
    readOnly?: boolean;
    onChange?(value?: string): UntypedPromise;
    onOpen?(willBeOpen: boolean): UntypedPromise;
    slim?: boolean;
    datatype?: string;
}

export function BootstrapDropdown({
    value,
    onChange,
    options,
    color,
    className,
    disabled,
    readOnly,
    onOpen,
    slim,
    datatype,
}: IBootstrapDropdownProps) {
    const element = useRef<HTMLDivElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

    useEffect(() => {
        function closeDropdownIfClickIsOutside(event: MouseEvent) {
            let currentElement: HTMLElement | null =
                event.target as HTMLElement | null;
            while (currentElement) {
                if (currentElement === element.current) {
                    // current element is this bootstrap dropdown parent, don't close the expander
                    return;
                }

                currentElement = currentElement.parentElement;
            }

            setDropdownOpen(false);
        }

        if (dropdownOpen) {
            document.addEventListener('click', closeDropdownIfClickIsOutside);

            return () =>
                document.removeEventListener(
                    'click',
                    closeDropdownIfClickIsOutside,
                );
        }
    }, [dropdownOpen]);

    if (!options || isEmpty(options)) {
        return (
            <button
                className={`btn btn-sm btn-${color || 'light'} dropdown-toggle`}
                disabled>
                &nbsp;
            </button>
        );
    }

    const selectedOption = options.filter((o) => o.value === value)[0];

    if (disabled) {
        return selectedOption ? (
            <button
                className={`btn btn-sm btn-${color || 'light'} dropdown-toggle`}
                disabled>
                {selectedOption.collapsedText || selectedOption.text}
            </button>
        ) : (
            <button
                className={`btn btn-sm btn-${color || 'light'} dropdown-toggle`}
                disabled></button>
        );
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

    return (
        <ButtonDropdown
            ref={element}
            isOpen={dropdownOpen}
            toggle={toggleOpen}
            className={className}
            datatype={datatype}>
            <DropdownToggle
                color={color || 'outline-light'}
                className="btn-sm text-dark border-dark">
                <span
                    className={`text-dark${slim ? '' : ' dropdown-text-min-width'}`}>
                    {selectedOption
                        ? selectedOption.collapsedText ||
                          selectedOption.text ||
                          value
                        : value}
                </span>
            </DropdownToggle>
            <DropdownMenu className="max-height-250 overflow-auto">
                {options.map((o: IBootstrapDropdownItem, index: number) => (
                    <button
                        key={o.value ?? index}
                        disabled={o.disabled || false}
                        role="menuitem"
                        className={`dropdown-item ${getItemClassName(o)}`}
                        onClick={async () =>
                            onChange ? await onChange(o.value) : null
                        }>
                        {o.text || o.value}
                    </button>
                ))}
            </DropdownMenu>
        </ButtonDropdown>
    );
}
