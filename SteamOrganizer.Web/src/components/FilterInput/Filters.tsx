import React, {FC, useState} from "react";
import {RadioButton} from "@/shared/ui/RadioButton/RadioButton";
import {CheckBox} from "@/shared/ui/CheckBox/CheckBox";
import {EFilterType, IFilterConfig, IPropField} from "@/components/FilterInput/types";
import {Icon, SvgIcon} from "@/defines";
import styles from "./Filters.module.css"

type FilterComponent = FC<{ fields: IPropField[], config: IFilterConfig, callback: () => void }>

const OrderFilter: FilterComponent = ({ fields, config, callback }) => {
    const node = config[EFilterType.Order];

    return (
        <>
            <RadioButton layoutId="order"
                         initialState={node.by?.[1] ?? 0}
                         generator={["None", ...fields.map(field => field.name)]}
                         onStateChanged={(o) => {
                             node.by = o === 0 ? null : [fields[o - 1].prop, o];
                             callback();
                         }}
                         className={`my-3 ${styles.orderFilter}`}/>

            <RadioButton layoutId="order-dir" generator={["Ascending", "Descending"]}
                         initialState={node.direction ?? 0}
                         onStateChanged={(o) => {
                             node.direction = o;
                             callback();
                         }}
                         className={`w-fit ${styles.orderFilter}`}/>
        </>
    )
}

const FlagsFilter: FilterComponent = ({ fields, config, callback }) => {
    const node = config[EFilterType.Flags];

    return fields.map((field, index) =>
        <div key={index} className={styles.flagFilter}>
            {field.name}
            <CheckBox checkedSymbol={<SvgIcon icon={Icon.Plus} size={16} /> }
                      initialState={node[field.prop]}
                      onStateChanged={(o) => {
                          node[field.prop] = o
                          callback();
                      }} allowIndeterminate={true}/>
        </div>
    )
}

const SearchFilter: FilterComponent = ({ fields, config, callback }) => {
    const node = config[EFilterType.Search];

    if(fields.length == 1) {
        return;
    }

    return (
        <RadioButton layoutId="search" generator={fields.map(field => field.name)}
                     initialState={node.by[0]}
                     onStateChanged={(i) => {
                         node.by = [i, fields[i].prop];
                         callback();
                     }}
                     className={styles.searchFilter}/>
    )
}

export { SearchFilter, OrderFilter, FlagsFilter }