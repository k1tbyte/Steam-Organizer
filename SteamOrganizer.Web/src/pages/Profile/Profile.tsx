import {FC} from "react";
import {useParams} from "react-router-dom";

export const Profile: FC = () => {
    const { id } = useParams();
    return (
        <p>{id}</p>
    )
}