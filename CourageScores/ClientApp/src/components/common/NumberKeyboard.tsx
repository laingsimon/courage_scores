import {MouseEvent} from "react";

export interface INumberKeyboardProps {
    value: string;
    onChange: (newValue: string) => Promise<any>;
    maxValue?: number;
}

export function NumberKeyboard({ value, onChange, maxValue }: INumberKeyboardProps) {
    async function numberClick(event: MouseEvent<HTMLButtonElement>) {
        const button: HTMLButtonElement = event.target as HTMLButtonElement;
        const buttonValue: string = button.textContent;

        const newValue: number = Number.parseInt(value + buttonValue);
        await onChange(newValue.toString());
    }

    async function onDelete() {
        const newStringValue: string = value.substring(0, value.length -1);
        const newValue: number = Number.parseInt(newStringValue);
        if (Number.isFinite(newValue) || newStringValue === '') {
            await onChange(newStringValue);
        }
    }

    function renderNumberButton(buttonValue: number) {
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

        return (<button className="btn btn-success m-1 flex-grow-1 flex-shrink-0 fs-1 px-4 py-2" onClick={numberClick} disabled={disabled}>
            {buttonValue}
        </button>);
    }

    return (<div className="d-flex flex-column p-3">
        <div className="d-flex flex-row flex-shrink-0 flex-grow-1">
            {renderNumberButton(7)}
            {renderNumberButton(8)}
            {renderNumberButton(9)}
        </div>
        <div className="d-flex flex-row flex-shrink-0 flex-grow-1">
            {renderNumberButton(4)}
            {renderNumberButton(5)}
            {renderNumberButton(6)}
        </div>
        <div className="d-flex flex-row flex-shrink-0 flex-grow-1">
            {renderNumberButton(1)}
            {renderNumberButton(2)}
            {renderNumberButton(3)}
        </div>
        <div className="d-flex flex-row flex-shrink-0 flex-grow-1">
            <button className="btn btn-warning m-1 flex-grow-1 flex-shrink-0 fs-1 px-4 py-2" onClick={onDelete} disabled={(value || '') === ''}>
                &larr;
            </button>
            {renderNumberButton(0)}
        </div>
    </div>)
}
