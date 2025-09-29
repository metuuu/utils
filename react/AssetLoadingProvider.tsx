/* eslint-disable react-hooks/rules-of-hooks */
"use client";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

const IMAGE_ASSETS = [
  "/assets/images/foo.webp",
  "/assets/images/bar.webp",
] as const;

const AUDIO_ASSETS = [
  "/assets/sound-effects/foo.mp3",
  "/assets/sound-effects/bar.mp3",
] as const;

const TOTAL_ASSETS = IMAGE_ASSETS.length + AUDIO_ASSETS.length;
const SHOULD_PRELOAD_ASSETS = process.env.NODE_ENV !== "development";

export default function LoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!SHOULD_PRELOAD_ASSETS) {
    return <>{children}</>;
  }

  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleAssetComplete = useCallback(() => {
    setLoadedCount((count) => count + 1);
  }, []);

  useEffect(() => {
    if (!TOTAL_ASSETS) {
      setIsLoading(false);
      return;
    }

    if (loadedCount >= TOTAL_ASSETS) {
      setIsLoading(false);
    }
  }, [loadedCount]);

  useEffect(() => {
    let isMounted = true;

    const cleanups = AUDIO_ASSETS.map((src) => {
      const audio = new Audio(src);

      const handleSuccess = () => {
        if (!isMounted) return;
        handleAssetComplete();
      };

      const handleError = () => {
        if (!isMounted) return;
        handleAssetComplete();
      };

      audio.addEventListener("canplaythrough", handleSuccess, { once: true });
      audio.addEventListener("error", handleError, { once: true });
      audio.load();

      return () => {
        audio.removeEventListener("canplaythrough", handleSuccess);
        audio.removeEventListener("error", handleError);
      };
    });

    return () => {
      isMounted = false;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [handleAssetComplete]);

  const progress = useMemo(() => {
    if (!TOTAL_ASSETS) return 1;
    return Math.min(loadedCount / TOTAL_ASSETS, 1);
  }, [loadedCount]);

  if (isLoading)
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 text-4xl">
        <div>
          Loading {loadedCount}/{TOTAL_ASSETS}
        </div>
        <div className="flex w-80 flex-col items-center gap-2 text-base">
          <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-neutral-800 transition-[width] duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span>{Math.round(progress * 100)}%</span>
        </div>
        <div className="hidden" aria-hidden>
          {IMAGE_ASSETS.map((src) => (
            <Image
              key={src}
              src={src}
              width={1024}
              height={1024}
              alt=""
              priority
              onLoadingComplete={handleAssetComplete}
              onError={handleAssetComplete}
            />
          ))}
        </div>
      </div>
    );

  return <>{children}</>;
}
