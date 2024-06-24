import {getSideMnemonicGenerator, IMnemonicGenerator} from "./MnemonicGenerators";

describe('MnemonicGenerator', () => {
    describe('getSideMnemonicGenerator', () => {
        it('returns A', () => {
            const generator: IMnemonicGenerator = getSideMnemonicGenerator();

            const result = generator.next();

            expect(result).toEqual('A');
        });

        it('returns Z', () => {
            const generator: IMnemonicGenerator = getSideMnemonicGenerator();

            const result = getNthMnemonic(generator, 26);

            expect(result).toEqual('Z');
        });

        it('returns AA', () => {
            const generator: IMnemonicGenerator = getSideMnemonicGenerator();

            const result = getNthMnemonic(generator, 27);

            expect(result).toEqual('AA');
        });

        it('returns AZ', () => {
            const generator: IMnemonicGenerator = getSideMnemonicGenerator();

            const result = getNthMnemonic(generator, 52);

            expect(result).toEqual('AZ');
        });

        it('returns BA', () => {
            const generator: IMnemonicGenerator = getSideMnemonicGenerator();

            const result = getNthMnemonic(generator, 53);

            expect(result).toEqual('BA');
        });

        function getNthMnemonic(generator: IMnemonicGenerator, count: number): string {
            for (let index = 0; index < count - 1; index++) {
                generator.next();
            }

            return generator.next();
        }
    });
});