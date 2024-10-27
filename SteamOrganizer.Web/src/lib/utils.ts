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

export const applyStyles = (element: HTMLElement, styles) => {
    Object.assign(element.style, styles);
};

export const findParentByAttribute = (element: HTMLElement, attribute: string): HTMLElement => {
    while (element) {
        if (element.hasAttribute(attribute)) {
            return element;
        }
        element = element.parentElement;
    }
    return null;
}

export const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
    let timerId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>): void => {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

/**
 * Utility function to get event coordinates.
 *
 * @returns {[screenX, screenY, clientX, clientY]} - The screen and client coordinates.
 */
export const getEventCords = (e): [number, number, number, number] => {
    const touch = e.touches?.[0];
    return touch ? [touch.screenX, touch.screenY, touch.clientX, touch.clientY] :
        [e.screenX, e.screenY, e.clientX, e.clientY];
};


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
