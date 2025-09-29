import { useEffect, useState } from "react";

import {
  createClampedDimensionsListener,
  type ClampedDimensions,
} from "./clampedDimensionsListener";

export function useClampedDimensions() {
  const [dimensions, setDimensions] = useState<ClampedDimensions | null>(null);

  useEffect(() => {
    const handleDimensions = (next: ClampedDimensions) => {
      setDimensions((prev) => {
        if (
          prev &&
          Math.abs(prev.width - next.width) < 0.5 &&
          Math.abs(prev.height - next.height) < 0.5
        )
          return prev;
        return next;
      });
    };

    const cleanup = createClampedDimensionsListener(handleDimensions);

    return () => cleanup();
  }, []);

  return dimensions;
}
