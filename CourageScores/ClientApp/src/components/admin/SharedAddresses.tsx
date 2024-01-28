import {SharedAddress} from "./SharedAddress";

export interface ISharedAddressesProps {
    addresses: string[][];
    onUpdate: (addresses: string[][]) => Promise<any>;
    className: string;
}

export function SharedAddresses({ addresses, onUpdate, className }: ISharedAddressesProps) {
    async function updateSharedAddress(update: string[], updateIndex: number) {
        await onUpdate(addresses.map((a: string[], index: number) => index === updateIndex ? update : a));
    }

    async function addAddress() {
        const newAddress: string[] = [];
        await onUpdate(addresses.concat([ newAddress ]));
    }

    async function deleteSharedAddress(index: number) {
        await onUpdate(addresses.filter((_: string[], i: number) => index !== i));
    }

    return (<ul className="list-group mb-3">
        <li className={`list-group-item ${className} text-light`}>
            Shared addresses
            <small className="small d-block">Each team on the same line has the same home-venue</small>
        </li>
        {addresses.map((a: string[], index: number) => <li className="list-group-item" key={index}>
            <SharedAddress
                address={a}
                onDelete={async () => await deleteSharedAddress(index)}
                onUpdate={async (update: string[]) => await updateSharedAddress(update, index)}
                className={className} />
        </li>)}
        <button className="list-group-item btn-primary small" onClick={addAddress}>
            ➕ Add shared address
        </button>
    </ul>);
}