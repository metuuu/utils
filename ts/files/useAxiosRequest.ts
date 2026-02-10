import {
  UseMutateAsyncFunction,
  UseMutateFunction,
  useMutation,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { errorToMessage } from "../utils/error-utils";
import axios, { AxiosRequestConfig } from "axios";
import { useMemo, useRef } from "react";

export type AxiosRequestHookConfig = Pick<
  AxiosRequestConfig<any>,
  | "headers"
  | "onUploadProgress"
  | "onDownloadProgress"
  | "data"
  | "params"
  | "url"
  | "method"
  | "responseType"
>;

export type UseAxiosRequestHookValue<TData, TError> = UseMutationResult<
  TData,
  TError,
  AxiosRequestHookConfig | void,
  unknown
> & { cancel: () => void };

/**
 * Hook for doing Axios requests one at a time.
 */
const useAxiosRequest = <TData = any, TError = any>(
  props?: UseMutationOptions<TData, TError, AxiosRequestHookConfig>,
) => {
  const refCancelFunction = useRef<() => void>(() => {});

  const mutation = useMutation<TData, TError, AxiosRequestHookConfig>({
    ...props,
    mutationFn: async (config) => {
      // Cancel configuration
      const cancelTokenSource = axios.CancelToken.source();
      refCancelFunction.current = () => cancelTokenSource?.cancel();

      // Request
      return axios
        .request({ ...config, cancelToken: cancelTokenSource.token })
        .then(({ data }) => data)
        .catch((err) => {
          console.debug(
            err.config?.method?.toUpperCase(),
            err?.config?.url?.replace(/^\/?/, "/"),
            `\n${err?.response?.status} - ${errorToMessage(err)}`,
          );
          throw err;
        });
    },
  });

  return useMemo(() => {
    return {
      ...mutation,
      cancel: () => refCancelFunction.current?.(),
    };
  }, [mutation]);
};

export default useAxiosRequest;
