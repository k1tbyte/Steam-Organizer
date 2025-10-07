export const enum EFilterType {
    Search,
    Order,
    Flags
}


export interface IPropField {
    name: string;
    prop: string;
}

export interface IFilterCell {
    label?: string;
    type: EFilterType;
    fields: IPropField[];
}

export type FiltersDefinition = IFilterCell[][]

export const enum EOrderDirection {
    Ascending = 0,
    Descending = 1
}

export interface IFilterConfig {
    [EFilterType.Search]: {
        keyword?: string,
        by: [ number, string]
    },
    [EFilterType.Order]?: {
        by?: [string, number] | null,
        direction?: EOrderDirection
    },
    [EFilterType.Flags]?: {
        [key: string]: boolean | null
    }
}
