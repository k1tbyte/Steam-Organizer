import {type FC, Fragment, useState} from "react";
import Input, {type IInputProps} from "@/shared/ui/Input";
import {Popup} from "@/shared/ui/Popup/Popup";
import {EPlacement} from "@/shared/ui/Popup/positioning";
import {ELabelVariant, Label} from "@/shared/ui/Label/Label";
import {EFilterType, FiltersDefinition, type IFilterCell, IFilterConfig} from "./types";
import {FlagsFilter, OrderFilter, SearchFilter} from "./Filters";
import styles from "./Filters.module.css"

interface ISearchInputProps extends IInputProps {
    filters: FiltersDefinition;
    config: IFilterConfig;
    onFilterChanged: () => void;
}

const filterType = {
    [EFilterType.Search]: SearchFilter,
    [EFilterType.Order]: OrderFilter,
    [EFilterType.Flags]: FlagsFilter
}

const FilterCell: FC<{items: IFilterCell[], callback: () => void, config: IFilterConfig}> = ({  items, config, callback }) => {
    return <div>
        {
            items.map((item, index) => {
                const Component = filterType[item.type];

                return <Fragment key={index}>
                    {item.label && <Label children={item.label} variant={ELabelVariant.Colorful}/>}
                    {<Component fields={item.fields} config={config} callback={callback}/>}
                </Fragment>
            })
        }
    </div>
}


export const FilterInput: FC<ISearchInputProps> = ({ onFilterChanged, config, filters, ...props}) => {
    const [isFocused,setFocused] = useState(undefined)

    const content = <div className={styles.filterInput}>
        {filters.map((item, index) => {
            return <FilterCell config={config} items={item} key={index} callback={onFilterChanged}/>
        })}
    </div>


    return (
        <Popup content={content} exit={{opacity: 0, translateY: "10px"}}
               placement={EPlacement.BottomFit} state={isFocused}
               asToggle={isFocused !== undefined}
               className={styles.popup}>
            <Input  defaultValue={config[EFilterType.Search].keyword}
                    onPointerDown={() => setFocused(undefined)}
                    onInput={(e) => {
                        setFocused(false)
                        config[EFilterType.Search].keyword = e.currentTarget.value;
                        onFilterChanged();
                    }}
                    className={"pr-24 h-full bg-primary placeholder:font-semibold rounded-lg"}
                    {...props}
            />
        </Popup>
    )
}
