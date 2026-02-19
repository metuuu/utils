import { useCallback } from "react";
import useListOfRefs from "./useListOfRefs";

const useFocusNextInputOnEnter = (onLastEnter?: () => void) => {
  const { refs: refInputs, addRef } = useListOfRefs<HTMLInputElement>();

  const onKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, inputIndex: number) => {
      if (e.key !== "Enter") return;
      // If last item
      if (inputIndex === refInputs.current.length - 1) {
        // Blur
        (e.target as HTMLElement).blur();
        // Call onLastEnterCallback
        onLastEnter?.();
      }
      // Focus next input on enter
      else refInputs.current[inputIndex + 1].focus();
    },
    [onLastEnter],
  );

  return { addRef, refInputs, onKeyUp };
};

export default useFocusNextInputOnEnter;
