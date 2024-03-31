import {FC, ReactNode} from "react"

interface ILayoutProps {
    sidebar: ReactNode
    header: ReactNode
    content: ReactNode
}

export  const HomeLayout: FC<ILayoutProps> = ( {sidebar,header, content}) => {
    return (
        <div className="h-screen flex flex-col">
            {header}
            <div className="h-full w-full flex">
                {sidebar}
                {content}
            </div>

        </div>
    )
}