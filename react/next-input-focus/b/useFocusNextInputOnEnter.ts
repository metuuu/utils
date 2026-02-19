import { useCallback } from "react";

/**
 * Hook to focus the next input on "Enter" key press using event delegation.
 * This should be applied to the `onKeyDown` prop of a `<form>` or container element.
 */
const useFocusNextInputOnEnter = (
  onLastEnter?: (e: React.KeyboardEvent<HTMLElement>) => void,
) => {
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      // We only care about Enter key
      if (e.key !== "Enter") return;

      // Ignore if it's a textarea (where Enter is usually intended for new lines)
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === "textarea") return;

      const formOrContainer = e.currentTarget;
      if (!formOrContainer) return;

      // Find all focusable elements that are not buttons or disabled
      // We focus on inputs, selects, and textareas that are not type="submit/button/hidden"
      const focusableElements = Array.from(
        formOrContainer.querySelectorAll<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >(
          'input:not([type="button"]):not([type="submit"]):not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
        ),
      ).filter((el) => {
        // Check for visibility and tabIndex
        const style = window.getComputedStyle(el);
        return (
          el.tabIndex >= 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const index = focusableElements.indexOf(target as any);

      if (index === -1) return;

      // Prevent default form submission or other Enter behavior
      e.preventDefault();

      if (index < focusableElements.length - 1) {
        // Focus the next element
        focusableElements[index + 1].focus();
      } else if (index === focusableElements.length - 1) {
        // Last element: blur and call onLastEnter
        target.blur();
        onLastEnter?.(e);
      }
    },
    [onLastEnter],
  );

  return { onKeyDown };
};

export default useFocusNextInputOnEnter;
