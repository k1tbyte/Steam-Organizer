import { FC } from 'react'

const Logo: FC = () => {
    return (
        <svg style={{ height: "70vh", width: "70vh" }} xmlns="http://www.w3.org/2000/svg">
            <use className="fill-tertiary" href={`/favicon.svg#logo`}/>
        </svg>
    )
}

export default Logo;