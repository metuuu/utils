import {
  QueryFunction,
  QueryKey,
  useMutation,
  useQuery,
  UseQueryOptions,
} from "@tanstack/react-query";
import { reactQueryClient } from ".";

export type MutationHookCallbackOptions<
  TData = void,
  TError = unknown,
  TVariables = unknown
> = {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (err: TError, variables: TVariables) => void;
};

type Query = (params: any) => {
  queryKey: any;
  queryFn: () => Promise<any>;
};

export const createQueryHook = <
  TQuery extends Query,
  TQueryFnData = TQuery extends (params: any) => {
    queryFn: () => Promise<infer R>;
  }
    ? R
    : unknown
>(
  queryFn: TQuery
) => {
  return <TData = TQueryFnData>(
    params: Parameters<TQuery>[0],
    options?: Pick<
      UseQueryOptions<TQueryFnData, unknown, TData>,
      "select" | "enabled"
    >
  ) => {
    return useQuery<TQueryFnData, unknown, TData>({
      ...queryFn(params),
      ...options,
    });
  };
};

export const createMutationHook = <TParams = void, TReturn = any>(
  mutation: () => {
    mutationKey?: any;
    mutationFn: (params: TParams) => Promise<TReturn>;
  }
) => {
  return (options?: MutationHookCallbackOptions<TReturn, unknown, TParams>) =>
    useMutation<TReturn, any, TParams>({
      ...mutation(),
      ...options,
    });
};

export const setTypedQueryData = <TQueryFn extends QueryFunction>(
  queryKeyStore: {
    queryFn?: TQueryFn;
    queryKey: QueryKey;
  },
  updater: (
    data: Awaited<ReturnType<TQueryFn>>
  ) => Awaited<ReturnType<TQueryFn>> | null | undefined
) => {
  const { queryKey } = queryKeyStore;
  return reactQueryClient.setQueryData(queryKey, updater);
};

export const updateGetQueryDataFromList = <TItem>(params: {
  items: TItem[];
  query: (item: TItem) => { queryKey: QueryKey };
}) => {
  const { items, query } = params;
  items.forEach((item) => {
    const { queryKey } = query(item);
    reactQueryClient.setQueryData(queryKey, item);
  });
};
