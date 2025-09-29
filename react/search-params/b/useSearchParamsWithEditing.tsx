"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * Allows setting and deleting search URLSearchParameters and updates browser URL to reflect the changes.
 */
export default function useSearchParamsWithEditing() {
  const searchParams = useSearchParams();

  const set = useCallback((key: string, value: string) => {
    const nextSearchParams = new URLSearchParams(window.location.search);
    nextSearchParams.set(key, value);
    window.history.replaceState(
      null,
      "",
      nextSearchParams.size
        ? `${window.location.pathname}?${nextSearchParams.toString()}`
        : window.location.pathname,
    );
  }, []);

  const remove = useCallback((key: string) => {
    const nextSearchParams = new URLSearchParams(window.location.search);
    nextSearchParams.delete(key);
    window.history.replaceState(
      null,
      "",
      nextSearchParams.size
        ? `${window.location.pathname}?${nextSearchParams.toString()}`
        : window.location.pathname,
    );
  }, []);

  return useMemo(
    () => ({
      get: (key: string) => searchParams.get(key),
      getAll: (key: string) => searchParams.getAll(key),
      has: (key: string) => searchParams.has(key),
      keys: () => searchParams.keys(),
      entries: () => searchParams.entries(),
      values: () => searchParams.values(),
      toString: () => searchParams.toString(),
      /** Sets or updates the search param and updates browser URL (keeps existing search params). */
      set,
      /** Removes the specified search param and updates browser URL. */
      delete: remove,
    }),
    [set, remove, searchParams],
  );
}
