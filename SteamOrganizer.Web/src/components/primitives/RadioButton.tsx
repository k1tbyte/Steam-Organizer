import {FC, ReactNode, useState} from "react";

interface IRadioButtonGroupProps {
    children: ReactNode[]
    activeIndex?: number;
    setActive: React.Dispatch<React.SetStateAction<number>>;
}

interface IRadioButtonProps {
    isActive: boolean;
    children: ReactNode;
    index: number;
    setActive: React.Dispatch<React.SetStateAction<number>>;
    className?: string;
}


export const RadioButtonGroup: FC<IRadioButtonGroupProps> = ({ children, activeIndex = 0, setActive }) => {

    return (
        children.map((child, index) => {
            return <RadioButton key={index}
                                isActive={index === activeIndex}
                                index={index}
                                setActive={setActive}>
                {child}
            </RadioButton>
        })
    )
}

const RadioButton: FC<IRadioButtonProps> = ({isActive, children, index, setActive, className}) => {

    return (
        <div onClick={() => {
            setActive(index);
        }}
             className={`rounded transition-transform cursor-pointer hover:scale-110 ${isActive ? "bg-chip text-foreground-accent" : "grad-chip text-foreground"}`}>
                {children}
        </div>
    )
}