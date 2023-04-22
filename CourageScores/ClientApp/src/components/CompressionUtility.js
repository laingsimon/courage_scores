export function compressJsonToBase64(obj) {
    const json = JSON.stringify(obj);
    return btoa(json);
}

export function decompressBase64ToJson(compressedBase64) {
    const json = atob(compressedBase64);
    return JSON.parse(json);
}