import React from "react";
import useFocusNextInputOnEnter from "./useFocusNextInputOnEnter";

/**
 * Props for the InputFocusGroup component.
 */
export type InputFocusGroupProps<T extends React.ElementType = "div"> = {
  /** The elements within which to manage input focus flow. */
  children: React.ReactNode;
  /** Callback fired when "Enter" is pressed on the last focusable input. */
  onLastEnter?: (e: React.KeyboardEvent<HTMLElement>) => void;
  /** Optional CSS class name for the wrapper element. */
  className?: string;
  /** The element type to use as the wrapper. Defaults to "div". */
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

/**
 * A wrapper component that automatically focuses the next input on "Enter" key press.
 * This component uses event delegation to manage focus flow among its children.
 * It is particularly useful for reducing boilerplate in forms.
 */
export default function InputFocusGroup<T extends React.ElementType = "div">({
  children,
  onLastEnter,
  className,
  as,
  onKeyDown: providedOnKeyDown,
  ...props
}: InputFocusGroupProps<T>) {
  const Component = as || "div";
  const { onKeyDown } = useFocusNextInputOnEnter(onLastEnter);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    onKeyDown(e);
    providedOnKeyDown?.(e);
  };

  return (
    <Component onKeyDown={handleKeyDown} className={className} {...props}>
      {children}
    </Component>
  );
}
