import {useActions} from "./useActions.ts";
import { useCallback } from "react";
import { IModalData, setModalData} from "../components/elements/Modal.tsx";

const useModal = () => {
    const { changeModalState} = useActions()

    const openModal = useCallback((data: IModalData) => {
        changeModalState(true)
        setModalData(data)
    },[])
    const closeModal = useCallback(() => changeModalState(false),[])

    return { openModal, closeModal  }
}

export default useModal;