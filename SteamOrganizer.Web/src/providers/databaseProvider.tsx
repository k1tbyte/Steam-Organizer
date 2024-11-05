import {createContext, type Dispatch, type FC, type ReactNode, type SetStateAction, useContext, useState} from "react";

type DatabaseContextType = {
    isUpdating?: boolean;
}

const DatabaseContext = createContext<DatabaseContextType>(undefined!);
let accessor: Dispatch<SetStateAction<DatabaseContextType>>;

export const setUpdating = (isUpdating: boolean) => {
    accessor(prev => {
        return { ...prev, isUpdating: isUpdating }
    });
}


export const DatabaseProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [context, setContext] = useState<DatabaseContextType>({})

    accessor = setContext

    return (
        <DatabaseContext.Provider value={context}>
            {children}
        </DatabaseContext.Provider>
    );
};

export const useDatabase = () => useContext(DatabaseContext);
