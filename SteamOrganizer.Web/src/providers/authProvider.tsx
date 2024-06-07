import React, {createContext, useContext, useState, ReactNode, useEffect} from 'react';
import {getUserProfile, initGapi, signIn, signOut, subscribe, unsubscribe} from "@/services/gAuthService.ts";

interface IAuthUser {
    isLoggedIn?: boolean | undefined;
    name?: string;
    profileImg?: string;
    email?:string;
}

interface AuthContextType {
    signIn: () => void;
    signOut: () => void;
    user: IAuthUser;
}

const AuthContext = createContext<AuthContextType>(undefined!);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IAuthUser>({});

  /*  useEffect(() => {
        const stateCallback = (state: boolean) => {
            let info;
            if(state) {
                const profile = getUserProfile()
                info ={
                    isLoggedIn: state,
                    email: profile.getEmail(),
                    name: profile.getName(),
                    profileImg: profile.getImageUrl()
                }
            }
            setUser(info ?? { isLoggedIn: state })
        }

        subscribe(stateCallback)
        initGapi()

        return () => unsubscribe(stateCallback)
    },[])*/


    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
