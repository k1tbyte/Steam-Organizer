import grid from "./images/grid.webp"

export const enum Gradients {
    LightBlue = "url(#lightBlueGrad)"
}

export function Defs() {
    return (
        <svg width={0} height={0}>
            <defs>
                <linearGradient id="lightBlueGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#87CEFA"/>
                    <stop offset="1" stopColor="#6c5ecf"/>
                </linearGradient>
            </defs>
        </svg>
    )
}

export {
    grid
}