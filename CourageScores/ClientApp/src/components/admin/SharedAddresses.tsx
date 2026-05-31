import { SharedAddress } from './SharedAddress.tsx';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface ISharedAddressesProps {
    addresses: string[][];
    onUpdate(addresses: string[][]): UntypedPromise;
    className: string;
    highlight?: string;
    setHighlight(highlight?: string): UntypedPromise;
    mnemonicsThatCanShareAddresses?: string[][];
}

export function SharedAddresses({
    addresses,
    onUpdate,
    className,
    highlight,
    setHighlight,
    mnemonicsThatCanShareAddresses,
}: ISharedAddressesProps) {
    async function updateSharedAddress(update: string[], updateIndex: number) {
        await onUpdate(
            addresses.map((a: string[], index: number) =>
                index === updateIndex ? update : a,
            ),
        );
    }

    async function addAddress() {
        const newAddress: string[] = [];
        await onUpdate(addresses.concat([newAddress]));
    }

    async function deleteSharedAddress(index: number) {
        await onUpdate(
            addresses.filter((_: string[], i: number) => index !== i),
        );
    }

    async function addAsSharedAddress(group: string[]) {
        await onUpdate(addresses.concat([group]));
    }

    function doesNotExist(sharedAddress: string[]) {
        const matchFunction = (a: string[]) => a.sort().join(',');
        const exists = addresses
            .map(matchFunction)
            .find((existing) => existing === matchFunction(sharedAddress));
        return !exists;
    }

    return (
        <ul className="list-group mb-3">
            <li className={`list-group-item ${className} text-light`}>
                Shared addresses
                <small className="small d-block">
                    Each team on the same line has the same home-venue
                </small>
            </li>
            {addresses.map((a: string[], index: number) => (
                <li className="list-group-item" key={index}>
                    <SharedAddress
                        address={a}
                        onDelete={async () => await deleteSharedAddress(index)}
                        onUpdate={async (update: string[]) =>
                            await updateSharedAddress(update, index)
                        }
                        className={className}
                        highlight={highlight}
                        setHighlight={setHighlight}
                    />
                </li>
            ))}
            {mnemonicsThatCanShareAddresses?.filter(doesNotExist).length ? (
                <div className="list-group-item" datatype="shareable-addresses">
                    <div>Mnemonics that share addresses are:</div>
                    {mnemonicsThatCanShareAddresses
                        .filter(doesNotExist)
                        .map((group: string[]) => {
                            return (
                                <button
                                    key={group.join(',')}
                                    className="btn btn-sm btn-secondary badge py-1 me-1"
                                    onClick={async () =>
                                        await addAsSharedAddress(group)
                                    }>
                                    {group.sort().join(', ')}
                                    <span className="fw-bold ms-1">↑</span>
                                </button>
                            );
                        })}
                </div>
            ) : null}
            <button
                className="list-group-item btn-primary small"
                onClick={addAddress}>
                ➕ Add shared address
            </button>
        </ul>
    );
}
