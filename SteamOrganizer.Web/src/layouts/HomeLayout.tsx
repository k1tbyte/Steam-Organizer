import {FC, ReactNode} from "react"

interface ILayoutProps {
    sidebar: ReactNode
    header: ReactNode
    content: ReactNode
}

export  const HomeLayout: FC<ILayoutProps> = ( {sidebar,header, content}) => {
    return (
        <div className="h-screen flex">
            {sidebar}

            <div className="flex flex-col h-full w-full">
                 {header}
                {content}
            </div>


        </div>
    )
}