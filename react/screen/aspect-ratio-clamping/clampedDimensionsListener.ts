export type ClampedDimensions = {
  width: number;
  height: number;
};

const MIN_ASPECT_RATIO = Math.min(3 / 4, 9 / 20);
const MAX_ASPECT_RATIO = Math.max(3 / 4, 9 / 20);

const ASPECT_RATIO_EPSILON = 0.001;

export function calculateClampedDimensions(
  width: number,
  height: number
): ClampedDimensions {
  const aspectRatio = width / height;
  const clampedAspectRatio = Math.min(
    Math.max(aspectRatio, MIN_ASPECT_RATIO),
    MAX_ASPECT_RATIO
  );

  if (Math.abs(aspectRatio - clampedAspectRatio) <= ASPECT_RATIO_EPSILON) {
    return { width, height };
  }

  if (aspectRatio < clampedAspectRatio) {
    return {
      width,
      height: width / clampedAspectRatio,
    };
  }

  return {
    width: height * clampedAspectRatio,
    height,
  };
}

export function createClampedDimensionsListener(
  onDimensions: (dimensions: ClampedDimensions) => void
): () => void {
  const updateDimensions = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (width === 0 || height === 0) {
      return;
    }

    onDimensions(calculateClampedDimensions(width, height));
  };

  updateDimensions();

  const resizeObserver = new ResizeObserver(() => {
    updateDimensions();
  });

  resizeObserver.observe(window.document.body);

  return () => {
    resizeObserver.disconnect();
  };
}
