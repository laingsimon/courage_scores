// noinspection JSUnresolvedReference

import {compressJsonToBase64, decompressBase64ToJson} from "./CompressionUtility";

describe('CompressionUtility', () => {
    describe('compress', () => {
       it('is shorter than uncompressed', async () => {
           const obj = { name: 'Simon' };
           const uncompressedData = btoa(JSON.stringify(obj));

           const compressedData = compressJsonToBase64(obj);

           expect(compressedData.length).toBeLessThanOrEqual(uncompressedData.length);
       });
    });

    describe('decompress', () => {
        it('it can be deserialised', async () => {
            const data = { name: 'Simon' };
            const compressedData = compressJsonToBase64(data);

            const result = decompressBase64ToJson(compressedData);

            expect(result).toEqual(data);
        });
    })
});