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
            <mask id="mask">

                <path className="st0" d="M152.18,175H31.1c-12.92,0-23.4-11.34-23.4-25.32L-0.19,26.68C-0.19,11.94,11.29,0,25.46,0h132.71c14.16,0,25.64,11.94,25.64,26.68l-8.24,123.01C175.58,163.66,165.1,175,152.18,175z" fill="#ffff"/>
            </mask>
        </svg>
    )
}

export {
    grid
}