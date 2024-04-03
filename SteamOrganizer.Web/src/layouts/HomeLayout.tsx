import {FC, ReactNode} from "react"

interface ILayoutProps {
    sidebar: ReactNode
    header: ReactNode
    content: ReactNode
}

export  const HomeLayout: FC<ILayoutProps> = ( {sidebar,header, content}) => {
    return (
        <div className="h-screen grid grid-rows-[max-content,auto] grid-cols-[max-content,auto]">
                {header}
                {sidebar}
                {content}
        </div>
    )
}