"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "./TransitionProvider";

type TransitionCallback = () => void;

export function useTransitionRouter() {
  const router = useRouter();
  const { startTransition, isTransitioning } = useTransition();

  const runWithCallback = (
    action: () => void,
    callback?: TransitionCallback
  ) => {
    if (callback) {
      callback();
    }
    action();
  };

  const push = (href: string, callback?: TransitionCallback) => {
    startTransition(() => {
      runWithCallback(() => router.push(href), callback);
    });
  };

  const replace = (href: string, callback?: TransitionCallback) => {
    startTransition(() => {
      runWithCallback(() => router.replace(href), callback);
    });
  };

  const back = (callback?: TransitionCallback) => {
    startTransition(() => {
      runWithCallback(() => router.back(), callback);
    });
  };

  const forward = (callback?: TransitionCallback) => {
    startTransition(() => {
      runWithCallback(() => router.forward(), callback);
    });
  };

  const refresh = (callback?: TransitionCallback) => {
    startTransition(() => {
      runWithCallback(() => router.refresh(), callback);
    });
  };

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    isTransitioning,
  };
}
