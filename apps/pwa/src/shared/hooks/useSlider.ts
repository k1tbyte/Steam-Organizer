import {useRef, useEffect, RefObject} from "react";

export const useSlider = (onSlide: (ev: PointerEvent) => any): RefObject<HTMLDivElement> => {
    const sliderRef = useRef<HTMLDivElement>(null)

    useEffect(() => {

        const slider = sliderRef.current;
        if(!slider) {
            return;
        }

        const beginSliding = (e: PointerEvent) => {
            slider.addEventListener('pointermove', onSlide);
            slider.setPointerCapture(e.pointerId);
        };

        const stopSliding = (e: PointerEvent) => {
            slider.removeEventListener('pointermove', onSlide);
            slider.releasePointerCapture(e.pointerId);
        };

        slider.addEventListener('pointerdown', beginSliding);
        slider.addEventListener('pointerup', stopSliding);

        return () => {
            slider.removeEventListener('pointerdown', beginSliding);
            slider.removeEventListener('pointerup', stopSliding);
        };

    }, []);

    return sliderRef;

}