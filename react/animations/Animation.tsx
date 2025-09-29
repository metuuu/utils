import clsx from "clsx";
import { Easing, motion, useAnimation, Variants } from "framer-motion";
import React, {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

export type AnimationType =
  | "fade-in"
  | "shake"
  | "squeeze"
  | "swing"
  | "pulse"
  | "ping"
  | "glow"
  | "rotate"
  | "grow"
  | "jump";

export type AnimationProps = {
  style?: React.CSSProperties;
  autoplay?: boolean;
  type?: AnimationType;
  className?: string;
  onAnimationEnd?: () => void;
  duration?: number;
  loop?: boolean | number;
  ease?: Easing;
  scale?: number;
  delay?: number;
};

export type AnimationRef = {
  start: () => void;
  stop: () => void;
  replay: () => void;
  pause: () => void;
  resume: () => void;
};

const scaleValueArray = (array: number[], scale = 1) =>
  array.map((x) => x * scale);
const scaleScaleArray = (array: number[], scale = 1) =>
  array.map((x) => (x - 1) * scale + 1);

const Animation = forwardRef<AnimationRef, PropsWithChildren<AnimationProps>>(
  (
    {
      style,
      children,
      autoplay,
      type = "shake",
      className,
      onAnimationEnd,
      duration,
      loop,
      ease,
      scale = 1,
      delay,
    },
    ref
  ) => {
    // Helper to get repeat value based on loop parameter
    const getRepeatValue = (loop?: boolean | number) => {
      if (loop === true) return Infinity;
      if (loop === false || loop === undefined) return 0;
      return typeof loop === "number" ? loop : 0;
    };

    // Animation variants for different types
    const animationVariants = useMemo<Record<AnimationType, Variants>>(
      () => ({
        "fade-in": {
          initial: { opacity: 0, pointerEvents: "none" },
          animate: {
            opacity: 1,
            pointerEvents: "auto",
            transition: {
              duration: duration || 0.5,
              ease: ease || "easeInOut",
              delay,
            },
          },
        },
        shake: {
          initial: { x: 0, y: 0, rotate: 0 },
          animate: {
            x: scaleValueArray([1, -1, -3, 3, 1, -1, -3, 3, -1, 1, 1], scale),
            y: scaleValueArray([1, -2, 0, 2, -1, 2, 1, 1, -1, 2, -2], scale),
            rotate: scaleValueArray(
              [0, -1, 1, 0, 1, -1, 0, -1, 1, 0, -1],
              scale
            ),
            transition: {
              duration: duration || 0.5,
              repeat: getRepeatValue(loop),
              ease: ease || "linear",
              delay,
            },
          },
        },
        squeeze: {
          initial: { scaleX: 1, scaleY: 1 },
          animate: {
            scaleX: scaleScaleArray([1, 1.1, 1], scale),
            scaleY: scaleScaleArray([1, 0.9, 1], scale),
            transition: {
              duration: duration || 0.6,
              repeat: getRepeatValue(loop),
              ease: ease || "easeInOut",
              delay,
            },
          },
        },
        swing: {
          initial: { rotate: 0 },
          animate: {
            rotate: scaleValueArray([0, 4, 0, -4, 0], scale),
            transition: {
              duration: duration || 0.8,
              repeat: getRepeatValue(loop),
              ease: ease || "easeInOut",
              delay,
            },
          },
        },
        pulse: {
          initial: { scale: 1 },
          animate: {
            scale: scaleScaleArray([1, 1.1, 1], scale),
            transition: {
              duration: duration || 0.8,
              repeat: getRepeatValue(loop),
              ease: ease || "easeInOut",
              delay,
            },
          },
        },
        ping: {
          initial: { scale: 1 },
          animate: {
            scale: scaleScaleArray([1, 2], scale),
            opacity: scaleValueArray([1, 0], scale),
            transition: {
              duration: duration || 0.8,
              repeat: getRepeatValue(loop),
              ease: ease || "easeInOut",
              delay,
            },
          },
        },
        glow: {
          initial: { scale: 1 },
          animate: {
            scale: scaleScaleArray([1, 1.1, 1], scale),
            filter: scaleValueArray([10, 20, 10], scale).map(
              (x) => `blur(${x}px)`
            ),
            transition: {
              duration: duration || 0.8,
              repeat: getRepeatValue(loop),
              ease: ease || "easeInOut",
              delay,
            },
          },
        },
        rotate: {
          initial: { rotate: 0 },
          animate: {
            rotate: [0, 360],
            transition: {
              duration: (duration || 0.8) * scale,
              repeat: getRepeatValue(loop),
              ease: ease || "linear",
              delay,
            },
          },
        },
        grow: {
          initial: { scale: 0.1 },
          animate: {
            scale: [0.1, 1 * scale],
            transition: {
              duration: duration || 1,
              repeat: getRepeatValue(loop),
              ease: ease || "easeInOut",
              delay,
            },
          },
        },
        jump: {
          initial: { y: 0 },
          animate: {
            y: scaleValueArray([0, -50, 0], scale),
            transition: {
              duration: duration || 0.8,
              repeat: getRepeatValue(loop),
              ease: ease || "easeInOut",
              delay,
            },
          },
        },
      }),
      [duration, loop, ease, scale, delay]
    );

    const controls = useAnimation();

    const refOnAnimationEnd = useRef(onAnimationEnd);
    refOnAnimationEnd.current = onAnimationEnd;
    const startAnimation = useCallback(async () => {
      await controls.start("animate");
      refOnAnimationEnd.current?.();
    }, [controls]);

    const stopAnimation = useCallback(() => {
      controls.start("initial");
    }, [controls]);

    const replayAnimation = useCallback(async () => {
      await controls.start("initial");
      startAnimation();
    }, [controls, startAnimation]);

    const pauseAnimation = useCallback(() => {
      controls.stop();
    }, [controls]);

    const resumeAnimation = useCallback(() => {
      startAnimation();
    }, [startAnimation]);

    useImperativeHandle(
      ref,
      () => ({
        start: startAnimation,
        stop: stopAnimation,
        replay: replayAnimation,
        pause: pauseAnimation,
        resume: resumeAnimation,
      }),
      [
        startAnimation,
        stopAnimation,
        replayAnimation,
        pauseAnimation,
        resumeAnimation,
      ]
    );

    // Auto-start animation if animate prop is true
    React.useEffect(() => {
      if (autoplay) {
        startAnimation();
      } else {
        stopAnimation();
      }
    }, [autoplay, startAnimation, stopAnimation]);

    const variants = animationVariants[type] || animationVariants.shake;

    return (
      <motion.div
        animate={controls}
        variants={variants}
        initial="initial"
        className={clsx(className)}
        style={style}
      >
        {children}
      </motion.div>
    );
  }
);

Animation.displayName = "Animation";
export default Animation;
