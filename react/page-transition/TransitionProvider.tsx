"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface TransitionContextType {
  startTransition: (callback: () => void) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function useTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("useTransition must be used within a TransitionProvider");
  }
  return context;
}

interface TransitionProviderProps {
  children: React.ReactNode;
}

export default function TransitionProvider({
  children,
}: TransitionProviderProps) {
  const IN_DURATION = 0.9;
  const OUT_DURATION = 0.75;

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const pathname = usePathname();
  const [previousPathname, setPreviousPathname] = useState(pathname);

  // Calculate scale needed to fill screen
  const calculateScale = () => {
    if (typeof window === "undefined") return 200; // Fallback for SSR

    const heartSize = 24; // Initial heart size in pixels
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calculate scale needed to cover the diagonal (ensures full coverage)
    const diagonal = Math.sqrt(
      screenWidth * screenWidth + screenHeight * screenHeight
    );
    const scale = Math.ceil(diagonal / heartSize);
    return scale * 1.75;
  };

  // console.log(pathname, previousPathname);

  // Listen for pathname changes to trigger fade out
  useEffect(() => {
    if (pathname !== previousPathname) {
      // Pathname changed, start fade out
      setTimeout(() => {
        setShowOverlay(false);
        setTimeout(() => {
          setIsTransitioning(false);
          setPreviousPathname(pathname);
        }, OUT_DURATION * 1000); // Fade out duration
      }, 100);
    }
  }, [pathname, previousPathname]);

  const startTransition = useCallback((callback: () => void) => {
    setIsTransitioning(true);
    setShowOverlay(true);

    // Execute callback after heart animation completes
    setTimeout(() => {
      callback();
    }, IN_DURATION * 1000); // Heart scaling duration
  }, []);

  // Heart SVG component
  const HeartIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-full w-full text-black"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );

  return (
    <TransitionContext.Provider value={{ startTransition, isTransitioning }}>
      {children}

      {/* Click blocker overlay */}
      {isTransitioning && (
        <div
          className="fixed inset-0 z-[9998]"
          style={{ pointerEvents: "all" }}
          onClickCapture={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

      {/* Transition overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: OUT_DURATION }}
          >
            {/* Heart animation */}
            <motion.div
              className="relative z-10"
              initial={{ scale: 0 }}
              animate={{ scale: calculateScale() }}
              transition={{
                duration: IN_DURATION,
                ease: "easeInOut",
              }}
              style={{
                width: "24px",
                height: "24px",
              }}
            >
              <HeartIcon />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TransitionContext.Provider>
  );
}
