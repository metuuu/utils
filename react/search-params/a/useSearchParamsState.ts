import { useCallback, useMemo, useState } from "react";
import { useEffectOnce } from "react-use";
import { isDeepStrictEqual } from "util";

/**
 * Only use this hook with search params that are related to each other. Otherwise use "useSearchParamState" separately for each key.
 * Returned state includes all search params. After a key is changed, it will always be overwritten with the local edited value.
 * If default values are provided and all values in url search params are equal to the default values, the values are hidden from url search params.
 * // TODO: Should we just show all search params always (or after first change)
 */
const useSearchParamsState = <
  TParams extends { [key: string]: string }
>(props?: {
  /** Used for making sure we only update the keys this state is handling */
  keys: (keyof TParams)[];
  defaultValues: TParams;
  /** If default values should initially overwrite the values in search params */
  overwriteExistingWithDefault?: boolean;
  // /** If your component doesn't always want to keep state in url search params, you can disable url search params with this option. */
  // areUrlSearchParamsDisabled?: boolean
}) => {
  const { keys, defaultValues, overwriteExistingWithDefault } = props || {};

  const urlSearchParamsToObjectAndRemoveOtherKeys = useCallback<any>(
    (params: URLSearchParams) =>
      Array.from(params.entries()).reduce(
        (prev, current) => ({
          ...prev,
          ...(keys?.includes(current[0]) && { [current[0]]: current[1] }),
        }),
        {}
      ),
    [keys]
  );

  const [editedState, setEditedState] = useState<Partial<TParams>>();
  useEffectOnce(() => {
    if (!defaultValues) return;
    if (overwriteExistingWithDefault) setSearchParams(defaultValues || {});
    else {
      const existingParams = new URLSearchParams(document.location.search);
      const initialParamsToSet: any = {};
      for (const key in defaultValues) {
        initialParamsToSet[key] = existingParams.get(key) || defaultValues[key];
      }
      setSearchParams(initialParamsToSet);
    }
  });

  const searchParams = useMemo(
    () => ({
      ...urlSearchParamsToObjectAndRemoveOtherKeys(
        new URLSearchParams(document.location.search)
      ),
      ...editedState,
    }),
    [editedState, urlSearchParamsToObjectAndRemoveOtherKeys]
  );

  const areAllParamsDefaultValues = useCallback(
    (params: any) => {
      if (!defaultValues) return false;
      const paramKeys = Object.keys(params);
      const defaultValKeys = Object.keys(defaultValues || {});
      for (const key of defaultValKeys) {
        const val = paramKeys.includes(key) ? params[key] : editedState?.[key];
        if (val !== defaultValues?.[key]) return false;
      }
      return true;
    },
    [editedState]
  );

  const setSearchParams = useCallback(
    (params: Partial<TParams>) => {
      // Set value to default if it set to undefined
      const processedParams = Object.entries(params).reduce(
        (acc, [key, value]) => {
          if (value !== undefined) return { ...acc, [key]: value };
          if (defaultValues?.[key])
            return { ...acc, [key]: defaultValues[key] };
          return acc;
        },
        {} as Partial<TParams>
      );

      const allParams = {
        ...defaultValues,
        ...searchParams,
        ...processedParams,
      };
      const areAllDefaultValues = areAllParamsDefaultValues(allParams);

      const newParams = new URLSearchParams(
        new URLSearchParams(document.location.search)
      );

      // When default values are used
      if (defaultValues) {
        // If all params are default params, then remove all params
        if (areAllDefaultValues) {
          Object.keys({ ...defaultValues, ...params }).forEach((key) =>
            newParams.delete(key)
          );
        }
        // Otherwise keep all params
        else {
          Object.entries(allParams).forEach(([key, value]) =>
            newParams.set(key, value as any)
          );
        }
      }
      // No default values
      else {
        const paramsWithoutValues = Object.entries(params).filter(
          ([key, val]) => !val || defaultValues?.[key] === val
        );
        const paramsWithValues = Object.entries(params).filter(
          ([key, val]) => !!val && defaultValues?.[key] !== val
        );
        paramsWithoutValues.forEach(([key]) => newParams.delete(key));
        paramsWithValues.forEach(([key, value]) =>
          newParams.set(key, value as string)
        );
      }

      setEditedState({
        ...defaultValues,
        ...urlSearchParamsToObjectAndRemoveOtherKeys(newParams),
      });

      if (
        // !areUrlSearchParamsDisabled ||
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
    [
      areAllParamsDefaultValues,
      searchParams,
      urlSearchParamsToObjectAndRemoveOtherKeys,
    ]
  );

  return [searchParams, setSearchParams] as const;
};

export default useSearchParamsState;
