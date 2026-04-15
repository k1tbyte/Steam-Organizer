export const enum ETimeUnit {
    Years,
    Months,
    Days,
    Hours,
    Minutes,
    Seconds,
}

export const enum TimeFormat {
    None = 0,
    Seconds = 1 << 0,
    Minutes = 1 << 1,
    Hours   = 1 << 2,
    Days    = 1 << 3,
    Months  = 1 << 4,
    Years   = 1 << 5,
    All = Years | Months | Days | Hours | Minutes | Seconds
}

interface TimeUnitConfig {
    s: number;
    format: TimeFormat;
    name: string;
}

const units: TimeUnitConfig[] = [
    {
        s: 31536000,
        format: TimeFormat.Years,
        name: 'year'
    },
    {
        s: 2592000,
        format: TimeFormat.Months,
        name: 'month'
    },
    {
        s: 86400,
        format: TimeFormat.Days,
        name: 'day'
    },
    {
        s: 3600,
        format: TimeFormat.Hours,
        name: 'hour'
    },
    {
        s: 60,
        format: TimeFormat.Minutes,
        name: 'minute'
    },
    {
        s: 1,
        format: TimeFormat.Seconds,
        name: 'second'
    }
];

const dateOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
} satisfies Intl.DateTimeFormatOptions;

export const dateFormatter = new Intl.DateTimeFormat(navigator.language, dateOptions);

export function formatTimeDifference(
    value: number,
    inputUnit: ETimeUnit = ETimeUnit.Seconds,
    outputFormat: TimeFormat = TimeFormat.All
): string {
    let remaining = value * units[inputUnit].s;
    const parts: string[] = [];

    for (let i = 0; i <= ETimeUnit.Seconds; i++) {
        const config = units[i];
        if (!(outputFormat & config.format)) {
            continue;
        }

        const value = Math.floor(remaining / config.s);
        const isLastUnit = units.find(u => outputFormat & u.format) === config;

        if (value > 0 || (parts.length > 0 && isLastUnit)) {
            parts.push(`${value} ${config.name}${value !== 1 ? 's' : ''}`);
            remaining %= config.s;
        }
    }

    return parts.join(' ');
}

export const formatFileDate = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`;
}