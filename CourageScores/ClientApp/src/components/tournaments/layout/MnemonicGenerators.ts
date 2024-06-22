export interface IMnemonicGenerator {
    next(): string;
}

export function getPrefixIncrementingMnemonicCalculator(prefix: string): IMnemonicGenerator {
    let index: number = 0;
    return {
        next(): string {
            return prefix + (++index);
        }
    };
}

export function getPrefixDecrementingMnemonicCalculator(initial: number, prefix: string): IMnemonicGenerator {
    let index: number = initial;
    return {
        next(): string {
            return prefix + (index--);
        }
    };
}
