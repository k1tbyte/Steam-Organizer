import { md5 } from "@/lib/md5.js";
import {fromLittleEndian, toLittleEndian} from "@/lib/utils.ts";

export const id64Indent = 76561197960265728n;
const Base32 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const enum ESteamIdType {
    Invalid = -1,
    AccountID,
    SteamID64,
    SteamID2,
    SteamID3,
    CsFriendCode,
    Steam3Hex,
}

type ISteamIdConverter = {
    matcher: RegExp;
    to: (id: string) => number;
    from: (accountId: number) => string;
}

export const converters: ISteamIdConverter[] = [
    {
        matcher: new RegExp("^[0-9]{1,10}$"),
        to: id => Number(id),
        from: accountId => String(accountId)
    },
    {
        matcher: new RegExp("^[0-9]{17}$"),
        to: id => Number(BigInt(id) - id64Indent),
        from: accountId => String(BigInt(accountId) + id64Indent)
    },
    {
        matcher: new RegExp("^STEAM_[0-5]:[01]:\\d+$"),
        to: (id) => {
            const chunks = id.split(':')
            return Number(chunks[2]) * 2 + Number(chunks[1])
        },
        from: accountId => `STEAM_0:${(accountId % 2 == 0 ? 0 : 1)}:${Math.floor(accountId / 2)}`
    },
    {
        matcher: new RegExp("^\\[U:1:[0-9]+]$"),
        to: (id) => Number(id.split(':')[2].replace(']', "")),
        from: accountId => `[U:1:${accountId}]`
    },
    {
        matcher: new RegExp("^(?=^.{10}$)([A-Za-z\\d]+-[A-Za-z\\d]{4})$"),
        to: id => decodeCsCode(id),
        from: accountId => encodeCsCode(accountId)
    },
    {
        matcher: new RegExp("^(steam:[0-9A-Fa-f]{15})+$"),
        to: id => Number(BigInt("0x" + id.split(':')[1]) - id64Indent),
        from: accountId => "steam:" + (BigInt(accountId) + id64Indent).toString(16)
    }
]

const idFromUrl = new RegExp("/(?:id|profiles)/([^/, ]+)")

export const toAccountId = (steamId: string) => {
    const id =   steamId.match(idFromUrl)?.[1] ?? steamId
    for (const converter of converters) {
        if(converter.matcher.test(id)) {
            return converter.to(id)
        }
    }
    // check vanity url
}

const decodeCsCode = (code: string) => {
    code = `AAAA${code.replace("-", "")}`;
    let res = BigInt(0);

    for (let i = 0; i < 13; i++) {
        res |= BigInt(Base32.indexOf(code[i])) << BigInt(5 * i);
    }

    const bytes = toLittleEndian(res,8)

    bytes.reverse();

    let decoded = BigInt(0);
    for (let i = 7; i >= 0; i--) {
        decoded = (decoded << BigInt(8)) | BigInt(bytes[i]);
    }

    let id = 0n;
    for (let i = 0; i < 8; i++)
    {
        decoded >>= 1n;
        let idNibble = decoded & 0xFn;
        decoded >>= 4n;

        id <<= 4n;
        id |= idNibble;
    }

    return Number(id);
}

const makeU64 = (value1: bigint, value2: bigint) => (value1 << BigInt(32)) | value2;

const encodeCsCode = (accountId: number) => {
    const strangeSteamId = BigInt(accountId) | (0x4353474F00000000n);
    let bytes = toLittleEndian(strangeSteamId, 8)
    const hash = fromLittleEndian(md5(bytes).slice(0,4),8)
    let id = BigInt(accountId) + id64Indent;

    let temp = BigInt(0);
    for (let i = 0; i < 8; i++) {
        const idNibble = id & BigInt(0xF);
        id >>= BigInt(4);

        const hashNibble = (hash >> BigInt(i)) & BigInt(1);
        const a = (temp << BigInt(4)) | idNibble;
        temp = makeU64(temp >> BigInt(28), a);
        temp = makeU64(temp >> BigInt(31), (a << BigInt(1)) | hashNibble);
    }

    let result = [];
    bytes = toLittleEndian(temp,8).reverse();
    id = fromLittleEndian(bytes, 8)

    for (let i = 0; i < 13; i++) {
        if (i === 4 || i === 9) {
            result.push('-');
        }
        result.push(Base32[Number(id & BigInt(0x1F))]);
        id >>= BigInt(5);
    }

    return result.slice(5).join('');
}