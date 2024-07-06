import React, {createContext, useContext} from "react";
import {type NavigateFunction, useNavigate} from "react-router-dom";

const RouterContext = createContext(undefined!);
export let router: NavigateFunction;

export const RouterProvider = ({ children }) => {
    router = useNavigate();
    return (
        <RouterContext.Provider value={router}>
            {children}
        </RouterContext.Provider>
    );
};

export const useRouter= () => useContext(RouterContext);