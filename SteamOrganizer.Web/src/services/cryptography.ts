const encoder = new TextEncoder();
const decoder = new TextDecoder()

const saltBytes = new Uint8Array ( [0x45, 0x4F, 0x74, 0x7A, 0x61, 0x6E, 0x6E, 0x58, 0x45, 0x4F, 0x53, 0x64, 0x35, 0x48, 0x47, 0x42, 0x53, 0x4A, 0x76, 0x73, 0x30, 0x6F, 0x70, 0x31, 0x42, 0x48, 0x52, 0x75, 0x76, 0x46, 0x77, 0x6C])

export const deriveKey = async (secret: string, iterations: number = 100000, keyUsage: KeyUsage[] = ["encrypt" , "decrypt"])  =>
    window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            hash: 'SHA-1',
            salt: saltBytes,
            iterations: iterations
        },
        await getPasswordKey(secret),
        { name: "AES-CBC", length: 256 }, false, keyUsage
    );

const getPasswordKey = (password: string) =>
    window.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
        "deriveKey",
    ]);

export async function encrypt(key: CryptoKey, data: string) : Promise<ArrayBuffer> {
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: "AES-CBC",
            iv: iv,
        },
        key,
        encoder.encode(data)
    );

    const vector = new Uint8Array( iv.byteLength + encryptedContent.byteLength);
    vector.set(iv, 0);
    vector.set(new Uint8Array(encryptedContent), iv.length)
    return vector.buffer
}

export async function decrypt(key: CryptoKey, data: ArrayBuffer) {
    const decryptedContent = await window.crypto.subtle.decrypt(
        {
            name: "AES-CBC",
            iv: data.slice(0,16),
        },
        key,
        data.slice(16)
    )

    return decoder.decode(decryptedContent);
}
