import React, {useState} from "react";
import {stateChanged} from "../../helpers/events";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

export interface ISharedAddressProps {
    address: string[];
    onUpdate(addresses: string[]): UntypedPromise;
    onDelete(): UntypedPromise,
    className?: string;
    highlight?: string;
    setHighlight(highlight?: string): UntypedPromise;
}

export function SharedAddress({ address, onUpdate, onDelete, className, highlight, setHighlight }: ISharedAddressProps) {
    const [ newAddress, setNewAddress ] = useState<string>('');

    async function deleteAddress(index: number) {
        await onUpdate(address.filter((_: string, i: number) => i !== index));
    }

    async function addAddress() {
        if (!newAddress) {
            window.alert('Enter a code for the team');
            return;
        }

        await onUpdate(address.concat([ newAddress ]));
        setNewAddress('');
    }

    async function onKeyUp(event: React.KeyboardEvent) {
        if (event.key === 'Enter') {
            await addAddress();
        }
    }

    async function highlightIfCtrlDown(event: React.MouseEvent<HTMLSpanElement>, mnemonic: string) {
        if (!event.ctrlKey) {
            if (highlight) {
                await setHighlight();
            }
            return;
        }

        await setHighlight(mnemonic);
    }

    function getHighlightClassName(mnemonic: string): string {
        return highlight === mnemonic
            ? ' bg-danger'
            : '';
    }

    return (<div title="Teams with the same address">
        {address.map((a: string, index: number) => <button
            key={index}
            onClick={() => deleteAddress(index)}
            className={`btn btn-sm margin-right badge py-1 ${className}${getHighlightClassName(a)}`}
            onMouseMove={async (event) => await highlightIfCtrlDown(event, a)}
            onMouseLeave={async () => await setHighlight()}>{a} &times;</button>)}
        <span className={`margin-right badge ${className}`}>
            <input className="width-20 outline-0 border-0" value={newAddress} onKeyUp={onKeyUp} onChange={stateChanged(setNewAddress)} />
            <button className={`${className} ms-1 border-0 px-0`} onClick={addAddress}>➕</button>
        </span>
        <button className="btn btn-sm btn-outline-danger float-end" onClick={onDelete}>🗑️ Remove</button>
    </div>);
}