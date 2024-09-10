import {MouseEvent, useEffect} from "react";

export interface INumberKeyboardProps {
    value: string;
    onChange: (newValue: string) => Promise<any>;
    maxValue?: number;
    onEnter: (value: string) => Promise<any>;
}

export function NumberKeyboard({ value, onChange, maxValue, onEnter }: INumberKeyboardProps) {
    useEffect(() => {
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keyup', handleKeyUp);
        }
    });

    async function handleKeyUp(event: KeyboardEvent) {
        const target = event.target as Element;
        if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'select' || target.tagName.toLowerCase() === 'textarea') {
            return;
        }

        if (event.key === 'Enter') {
            await onEnter(value);
            return;
        }

        if (event.key === 'Backspace') {
            await onDelete();
            return;
        }

        const keyNumber: number = Number.parseInt(event.key);
        if (!Number.isNaN(keyNumber)) {
            const newValue: number = Number.parseInt(value + event.key);
            if (!maxValue || newValue <= maxValue) {
                await onChange(newValue.toString());
            }
            return;
        }
    }

    async function numberClick(event: MouseEvent<HTMLButtonElement>) {
        const button: HTMLButtonElement = event.target as HTMLButtonElement;
        const buttonValue: string = button.textContent;

        const newValue: number = Number.parseInt(value + buttonValue);
        await onChange(newValue.toString());
        await hapticFeedback();
    }

    async function quickButtonClick(event: MouseEvent<HTMLButtonElement>) {
        const button: HTMLButtonElement = event.target as HTMLButtonElement;
        const buttonValue: string = button.textContent;
        await hapticFeedback();
        await onEnter(buttonValue);
    }

    async function onDelete() {
        const newStringValue: string = value.substring(0, value.length -1);
        const newValue: number = Number.parseInt(newStringValue);
        if (Number.isFinite(newValue) || newStringValue === '') {
            await onChange(newStringValue);
            await hapticFeedback();
        }
    }

    async function hapticFeedback() {
        /* istanbul ignore next */
        if (navigator.vibrate) {
            /* istanbul ignore next */
            navigator.vibrate([30]);
        }
    }

    function renderButton(buttonValue: number, className: string, handler: (event: MouseEvent<HTMLButtonElement>) => Promise<any>) {
        let disabled: boolean = false;
        if (buttonValue === 0 && value === '0') {
            // don't allow leading 0's
            disabled = true;
        }
        const numberValue: number = Number.parseInt(value);
        if (maxValue && numberValue >= maxValue) {
            disabled = true;
        }

        const potentialValue: number = Number.parseInt(value + buttonValue.toString());
        if (!Number.isFinite(potentialValue) || (maxValue && potentialValue > maxValue)) {
            disabled = true;
        }

        return (<button className={`btn m-1 d-inline-block flex-grow-1 flex-shrink-1 fs-1 py-3 ${className}`} onClick={handler} disabled={disabled}>
            <span className="px-2 py-1 d-inline-block">{buttonValue}</span>
        </button>);
    }

    function renderNumberButton(buttonValue: number) {
        return renderButton(buttonValue, 'min-width-75 btn-success px-1', numberClick);
    }

    function renderQuickButton(buttonValue: number) {
        return renderButton(buttonValue, 'min-width-75 btn-secondary opacity-50 px-1', quickButtonClick);
    }

    return (<div className="d-flex flex-column p-3">
        <div className="d-flex flex-row flex-shrink-0 flex-grow-1">
            {renderQuickButton(140)}

            {renderNumberButton(7)}
            {renderNumberButton(8)}
            {renderNumberButton(9)}

            {renderQuickButton(100)}
        </div>
        <div className="d-flex flex-row flex-shrink-0 flex-grow-1">
            {renderQuickButton(60)}

            {renderNumberButton(4)}
            {renderNumberButton(5)}
            {renderNumberButton(6)}

            {renderQuickButton(40)}
        </div>
        <div className="d-flex flex-row flex-shrink-0 flex-grow-1">
            {renderQuickButton(45)}

            {renderNumberButton(1)}
            {renderNumberButton(2)}
            {renderNumberButton(3)}

            {renderQuickButton(26)}
        </div>
        <div className="d-flex flex-row flex-shrink-0 flex-grow-1">
            <button className="btn btn-warning m-1 flex-grow-1 flex-shrink-0 fs-1 px-4 py-2" onClick={onDelete}
                    disabled={(value || '') === ''}>
                &larr;
            </button>
            {renderNumberButton(0)}
            <button className="btn btn-primary m-1 flex-grow-1 flex-shrink-0 fs-1 px-4 py-2" onClick={async () => await onEnter(value)} disabled={!value}>
                &rarr;
            </button>
        </div>
    </div>)
}
