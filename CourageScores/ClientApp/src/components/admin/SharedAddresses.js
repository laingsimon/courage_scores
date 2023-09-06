import {SharedAddress} from "./SharedAddress";

export function SharedAddresses({ addresses, onUpdate, className }) {
    function updateSharedAddress(update, updateIndex) {
        onUpdate(addresses.map((a, index) => index === updateIndex ? update : a));
    }

    function addAddress() {
        const newAddress = [];
        onUpdate(addresses.concat([ newAddress ]));
    }

    function deleteSharedAddress(index) {
        onUpdate(addresses.filter((a, i) => index !== i));
    }

    return (<ul className="list-group mb-3">
        <li className={`list-group-item ${className} text-light`}>
            Shared addresses
            <small className="small d-block">Each team on the same line has the same home-venue</small>
        </li>
        {addresses.map((a, index) => <li className="list-group-item" key={index}>
            <SharedAddress
                address={a}
                onDelete={() => deleteSharedAddress(index)}
                onUpdate={(update) => updateSharedAddress(update, index)}
                className={className} />
        </li>)}
        <button className="list-group-item btn-primary small" onClick={addAddress}>
            ➕ Add shared address
        </button>
    </ul>);
}