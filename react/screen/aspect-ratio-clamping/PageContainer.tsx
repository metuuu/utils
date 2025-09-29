"use client";
import { useRef } from "react";
import { useClampedDimensions } from "./useClampedDimensions";

export default function PageContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useClampedDimensions();

  const contentStyle = dimensions
    ? {
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }
    : {
        width: "100%",
        height: "100%",
      };

  const pleaseRotateDeviceOverlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black px-4"
      style={{ pointerEvents: "all" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="font-dyna-puff text-center text-2xl text-white">
        Rotate your device to continue
      </div>
    </div>
  );

  const shouldRotate =
    window.innerHeight < 480 && window.innerWidth > window.innerHeight;

  return (
    <div
      ref={containerRef}
      className="flex h-dvh w-dvw items-center justify-center"
    >
      {shouldRotate && pleaseRotateDeviceOverlay}
      <div
        className="@container/page relative h-full w-full overflow-hidden"
        style={contentStyle}
      >
        {children}
      </div>
    </div>
  );
}
