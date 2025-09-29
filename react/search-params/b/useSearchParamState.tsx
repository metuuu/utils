import { useCallback, useMemo, useState } from "react";
import useSearchParamsWithEditing from "./useSearchParamsWithEditing";

export default function useSearchParamState<T = unknown>({
  key,
  initialValue,
  type,
}: {
  key: string;
  /** Initial value unless param is found from search params */
  initialValue: T;
  type?: "string" | "number" | "string[]" | "number[]" | "boolean" | "other";
}) {
  const searchParams = useSearchParamsWithEditing();

  const initialValueFromParams = useMemo(() => {
    try {
      const value = searchParams.get(key);
      if (value == null) return;
      if (type === "other")
        return value ? (JSON.parse(atob(value)) as T) : undefined;
      if (type === "boolean") return (value === "true") as T;
      if (type === "string[]") return value.split(",") as T;
      if (type === "number[]")
        return value.split(",").map(Number) as unknown as T;
      return value;
    } catch (error) {
      console.error("Failed to parse search param initial value", key, error);
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, setState] = useState<T>(
    (initialValueFromParams ?? initialValue) as T,
  );

  const setStateAndSearchParams = useCallback(
    (value: T) => {
      setState(value);
      if (value != null && value !== "") {
        if (type === "other") {
          if (Object.keys(value || {}).length === 0) searchParams.delete(key);
          else searchParams.set(key, btoa(JSON.stringify(value)));
        } else if (type === "string[]" || type === "number[]") {
          if ((value as Array<unknown>).length === 0) searchParams.delete(key);
          else searchParams.set(key, (value as Array<unknown>).join(","));
        } else {
          searchParams.set(key, value.toString());
        }
      } else {
        searchParams.delete(key);
      }
    },
    [key, searchParams, type],
  );

  return [state, setStateAndSearchParams] as const;
}
