import React, {createContext, useContext, useState, type ReactNode, useEffect} from 'react';
import {getUserProfile, initGapi, isAuthorized, signIn, signOut} from "@/shared/services/gAuth";

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

    if(!import.meta.env.VITE_SKIP_GAPI) {
        useEffect(() => {
            const stateCallback = (state: boolean) => {
                let info: IAuthUser;
                if (state) {
                    const profile = getUserProfile()
                    info = {
                        isLoggedIn: state,
                        email: profile.getEmail(),
                        name: profile.getName(),
                        profileImg: profile.getImageUrl()
                    }
                }
                setUser(info ?? {isLoggedIn: state})
            }

            isAuthorized.onChanged(stateCallback)
            initGapi()

            return () => isAuthorized.unsubscribe(stateCallback)
        }, [])
    }


    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
