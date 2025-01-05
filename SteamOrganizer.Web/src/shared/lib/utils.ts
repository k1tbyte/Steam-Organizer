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

export const formatFileDate = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`;
}

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

export function getScrollParent(element: HTMLElement) {
    while (element && element !== document.body) {
        const style = window.getComputedStyle(element);
        const overflowY = style.overflowY;

        if (overflowY === 'scroll' || overflowY === 'auto') {
            return element;
        }
        element = element.parentElement;
    }

    return window;
}

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

export const setDocumentTitle = (title: string) => {
    document.title = `${title ? `${title} - ` : ""}Steam Organizer`;
}


