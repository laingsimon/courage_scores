export interface IMnemonicAccumulator {
    next(): string;
}

export function getPrefixIncrementingMnemonicCalculator(prefix: string): IMnemonicAccumulator {
    let index: number = 0;
    return {
        next(): string {
            return prefix + (++index);
        }
    };
}

