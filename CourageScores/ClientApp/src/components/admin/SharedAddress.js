import {useState} from "react";
import {stateChanged} from "../../helpers/events";

export function SharedAddress({ address, onUpdate, onDelete, className }) {
    const [ newAddress, setNewAddress ] = useState('');

    function deleteAddress(index) {
        onUpdate(address.filter((a, i) => i !== index));
    }

    function addAddress() {
        if (!newAddress) {
            window.alert('Enter a code for the team');
            return;
        }

        onUpdate(address.concat([ newAddress ]));
        setNewAddress('');
    }

    function onKeyUp(event) {
        if (event.key === 'Enter') {
            addAddress();
        }
    }

    return (<div title="Teams with the same address">
        {address.map((a, index) => <button
            key={index}
            onClick={() => deleteAddress(index)}
            className={`btn btn-sm margin-right badge py-1 ${className}`}>{a} &times;</button>)}
        <span className={`margin-right badge ${className}`}>
            <input className="width-20 outline-0 border-0" value={newAddress} onKeyUp={onKeyUp} onChange={stateChanged(setNewAddress)} />
            <button className={`${className} ms-1 border-0 px-0`} onClick={addAddress}>➕</button>
        </span>
        <button className="btn btn-sm btn-outline-danger float-end" onClick={onDelete}>🗑️ Remove</button>
    </div>);
}