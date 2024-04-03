import { useState, useEffect } from "react";

interface IMediaProps {
    query: string,
    callback?: (match: boolean) => void;
}
const useMediaQuery = ( { query, callback }: IMediaProps) => {
    const [match, setMatch] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const updateMatch = () =>  {
            const isMatch = window.matchMedia(query).matches;
            setMatch(isMatch);
            if (callback) {
                callback(isMatch);
            }
        }

        window.matchMedia(query).addEventListener("change", updateMatch);

        return () => {
            window.matchMedia(query).removeEventListener("change", updateMatch);
        };
    }, [query]);

    return match;
};

export default useMediaQuery;