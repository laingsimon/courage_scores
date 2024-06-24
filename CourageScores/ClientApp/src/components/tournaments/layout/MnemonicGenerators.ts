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

export function getSideMnemonicGenerator(): IMnemonicGenerator {
    let index: number = 0;
    let range: number = -1;
    const mnemonics: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return {
        next(): string {
            if (index >= mnemonics.length) {
                range++;
                index = 0;
            }

            const prefix: string = range >= 0 ? mnemonics[range] : '';
            return prefix + mnemonics[index++];
        },
    };
}