import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const dateOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
} satisfies Intl.DateTimeFormatOptions;

export const dateFormatter = new Intl.DateTimeFormat(navigator.language, dateOptions);

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const toLittleEndian = (value: bigint, len: number) => {
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = Number(value & BigInt(0xFF));
        value >>= BigInt(len);
    }
    return bytes;
}

export const fromLittleEndian = (bytes: Uint8Array, len: number) => {
    return bytes.reduce((slice: bigint, byte: number, i: number) =>
        slice + (BigInt(byte) << (BigInt(i) * BigInt(len))), BigInt(0));
}

export const bufferToBase64 = (bytes: ArrayBuffer) => {
    return btoa(
        new Uint8Array(bytes)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
}

export const jsonIgnoreNull = (key: string, value: any) => {
    // Ignore fields with the prefix _ (95) and empty fields
    if(value !== null && value !== undefined && key.charCodeAt(0) != 95) {
        return value
    }
}

export function jsonDateReviver(key, value) {
    // Checking if the value is a string and if it matches the date format
    if (typeof value === 'string') {
        const date = new Date(value);
        // @ts-ignore
        if (!isNaN(date)) {
            return date;
        }
    }
    return value;
}
