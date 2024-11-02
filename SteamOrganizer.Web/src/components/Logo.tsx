import { FC } from 'react'

interface ILogoProps {
    width: number;
    height: number;
}

const Logo: FC<ILogoProps> = ({width, height}) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height={height} width={width}
             viewBox="47.797 14.063 439.4 467.3" id="sas">
            <defs>
                <linearGradient id="logo-gradient"  x1="50%" y1="0%" x2="50%" y2="100%">

                    <stop offset="0%" stopColor="#3c53c7">
                        <animate attributeName="stop-color" values="#3c53c7; #a570ff; #3c53c7" dur="4s"
                                 repeatCount="indefinite"></animate>
                    </stop>

                    <stop offset="100%" stopColor="#a570ff">
                        <animate attributeName="stop-color" values="#a570ff; #3c53c7; #a570ff" dur="4s"
                                 repeatCount="indefinite"></animate>
                    </stop>

                </linearGradient>

            </defs>

            <path fill="url('#logo-gradient')"
                  d=""/>
        </svg>
    )
}

export default Logo;