import { useState } from "react";
import { useUpdateEffect } from "react-use";
import { useEventListener } from "usehooks-ts";

// This adds vertical breakpoints and has proper typing

export const breakpointKeys = [
  "base",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
] as const;
export type BreakpointKey = (typeof breakpointKeys)[number];
// export type BreakpointKey = 'base' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// https://ui.docs.amplify.aws/react/theming/responsive#breakpoints
export const horizontalBreakpoints: Record<BreakpointKey, number> = {
  base: 0,
  xs: 320,
  sm: 480,
  md: 768,
  lg: 992,
  xl: 1280,
  "2xl": 1536,
};
export const verticalBreakpoints: Record<BreakpointKey, number> = {
  base: 0,
  xs: 320,
  sm: 480,
  md: 768,
  lg: 992,
  xl: 1280,
  "2xl": 1536,
};

export const useBreakpointValue = <
  T
>(values: // Partial<Record<BreakpointKey, T>>
{
  w?: Partial<Record<BreakpointKey, T>>;
  h?: Partial<Record<BreakpointKey, T>>;
}) => {
  const handleSize = (skipStateUpdate = false): T => {
    const breakpointsPerDir = {
      w: verticalBreakpoints,
      h: horizontalBreakpoints,
    };
    const sizePerDir = {
      w: window.innerWidth,
      h: window.innerHeight,
    };

    for (const breakpoint of [...breakpointKeys].reverse()) {
      const [f, s] = Object.keys(values);
      const dirFirst = f as "w" | "h";
      const dirSecond = s as "w" | "h";

      const dirFirstExists = Object.keys(values[dirFirst] || []).includes(
        breakpoint
      );
      const dirSecondExists = Object.keys(values[dirSecond] || []).includes(
        breakpoint
      );

      let hasNewValue;
      let newValue;
      if (
        dirFirstExists &&
        breakpointsPerDir[dirFirst][breakpoint] < sizePerDir[dirFirst]
      ) {
        hasNewValue = true;
        newValue = values[dirFirst]![breakpoint];
      } else if (
        dirSecondExists &&
        breakpointsPerDir[dirSecond][breakpoint] < sizePerDir[dirSecond]
      ) {
        hasNewValue = true;
        newValue = values[dirSecond]![breakpoint];
      }

      if (hasNewValue) {
        if (!skipStateUpdate && value !== newValue) setValue(newValue as T);
        return newValue as T;
      }
    }
    throw new Error("Please provide base value");
  };

  const [value, setValue] = useState<T>(handleSize(true));
  useEventListener("resize", () => {
    handleSize();
  });

  useUpdateEffect(() => {
    handleSize();
  }, [values]);

  return value;
};

export function useBreakpointW({
  breakpoint,
  comparison = ">=",
}: {
  breakpoint: BreakpointKey;
  comparison: ">=" | "<";
}) {
  const currentBreakpoint = useBreakpointValue<BreakpointKey>({
    w: {
      base: "base",
      xs: "xs",
      sm: "sm",
      md: "md",
      lg: "lg",
      xl: "xl",
      "2xl": "2xl",
    },
  });

  if (comparison === ">=") {
    return (
      breakpointKeys.indexOf(currentBreakpoint) >=
      breakpointKeys.indexOf(breakpoint)
    );
  } else {
    return (
      breakpointKeys.indexOf(currentBreakpoint) <
      breakpointKeys.indexOf(breakpoint)
    );
  }
}

export const useBreakpointValueW = <T>(
  values: Partial<Record<BreakpointKey, T>>
) => {
  return useBreakpointValue({ w: values });
};

export const useBreakpointValueH = <T>(
  values: Partial<Record<BreakpointKey, T>>
) => {
  return useBreakpointValue({ h: values });
};
