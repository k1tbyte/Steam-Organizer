import { useEffect } from "react";

interface IMediaProps {
    query: string,
    callback?: (match: boolean) => void;
}
const useMediaQuery = ( { query, callback }: IMediaProps) => {
    useEffect(() => {
        const updateMatch = () =>  {
            const isMatch = window.matchMedia(query).matches;
            if (callback) {
                callback(isMatch);
            }
        }

        window.matchMedia(query).addEventListener("change", updateMatch);

        return () => {
            window.matchMedia(query).removeEventListener("change", updateMatch);
        };
    }, [query]);

    return window.matchMedia(query).matches;
};

export default useMediaQuery;