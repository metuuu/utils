import { useCallback, useMemo } from "react";
import { useSearchParams as useNextSearchParams } from "next/navigation";
import { isDeepStrictEqual } from "util";

/**
 * This hook includes typed util functions for changing URL search params.
 */
const useSearchParams = <TParams extends { [key: string]: string }>() => {
  const urlSearchParams = useNextSearchParams();

  const setSearchParam = useCallback(
    <TName extends keyof TParams>(
      name: TName,
      value: TParams[TName] | undefined
    ) => {
      if (!value) return removeSearchParams(name);

      const newParams = new URLSearchParams(document.location.search);
      newParams.set(name as string, value);

      if (
        isDeepStrictEqual(
          Array.from(newParams.entries()),
          Array.from(new URLSearchParams(document.location.search).entries())
        )
      )
        return;

      window.history.replaceState(
        null,
        "",
        newParams.size
          ? `${window.location.pathname}?${newParams.toString()}`
          : window.location.pathname
      );
    },
    []
  );

  const removeSearchParams = useCallback(
    (...searchParamNamesToRemove: (keyof TParams)[]) => {
      const newParams = new URLSearchParams(document.location.search);
      searchParamNamesToRemove.forEach((paramToRemove) =>
        newParams.delete(paramToRemove as string)
      );

      if (
        isDeepStrictEqual(
          Array.from(newParams.entries()),
          Array.from(new URLSearchParams(document.location.search).entries())
        )
      )
        return;

      window.history.replaceState(
        null,
        "",
        newParams.size
          ? `${window.location.pathname}?${newParams.toString()}`
          : window.location.pathname
      );
    },
    []
  );

  const searchParams = useMemo(() => {
    const keys = Array.from(urlSearchParams.keys());
    const params: Record<string, string> = {};
    for (const key of keys) {
      const val = urlSearchParams.get(key);
      if (val) params[key] = val;
    }
    return params;
  }, [urlSearchParams]);

  return useMemo(
    () => ({
      // get: (key: keyof TParams) => (searchParams as TParams)[key],
      values: searchParams as TParams,
      set: setSearchParam,
      remove: removeSearchParams,
    }),
    [searchParams, setSearchParam, removeSearchParams]
  );
};

export default useSearchParams;
