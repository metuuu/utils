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
  TVariables = unknown,
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
    : unknown,
>(
  queryFn: TQuery,
) => {
  return <TData = TQueryFnData>(
    params: Parameters<TQuery>[0],
    options?: Pick<
      UseQueryOptions<TQueryFnData, unknown, TData>,
      "select" | "enabled"
    >,
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
  },
) => {
  return (options?: MutationHookCallbackOptions<TReturn, unknown, TParams>) =>
    useMutation<TReturn, any, TParams>({
      ...mutation(),
      ...options,
    });
};

export const setTypedQueryData = <TData = any>(
  queryKeyStore: {
    queryFn?: QueryFunction<TData, any>;
    queryKey: QueryKey;
  },
  updater: (data: TData) => TData | null | undefined,
) => {
  const { queryKey } = queryKeyStore;
  return reactQueryClient.setQueryData(queryKey, updater as any);
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

/**
 * Updates existing items in the list query cache.
 * Adds item to start or invalidates cache if the item is not found in the list depending on "noExistingItemAction"
 * Removes the item from lists if `item` is set to `null`.
 */
export const updateListQueryCache = <
  TItem extends { id: string },
  TQueryKeys extends {
    _def: readonly [string];
    list: (filters: unknown) => { queryKey: QueryKey };
  },
>({
  queryKeys,
  itemId,
  item,
  filterCombinations,
  noExistingItemAction = "invalidate",
}: {
  queryKeys: TQueryKeys;
  itemId: string;
  /** If null, handled as deleted */
  item: TItem | null;
  /** If set to undefined, update to all list caches */
  filterCombinations?: Parameters<typeof queryKeys.list>["0"][];
  /**
   * Action to take if item is not found in the list
   * @default "invalidate"
   */
  noExistingItemAction?: "prepend" | "invalidate";
}) => {
  let queryKeysToUpdate = filterCombinations?.map(
    (filters) => queryKeys.list(filters).queryKey,
  );

  if (!queryKeysToUpdate) {
    const queryCache = reactQueryClient.getQueryCache();
    const listQueries = queryCache.findAll({
      queryKey: [queryKeys._def[0], "list"],
      exact: false,
    });
    queryKeysToUpdate = listQueries.map((query) => query.queryKey);
  }

  queryKeysToUpdate.forEach((queryKey) => {
    // Item update
    if (item) {
      setTypedQueryData({ queryKey }, (existingItems: TItem[] | undefined) => {
        if (!existingItems) return undefined;
        const updateExisting = !!existingItems?.find(
          ({ id }) => item.id === id,
        );
        if (updateExisting)
          return existingItems.map((existingItem) =>
            existingItem.id === item.id ? item : existingItem,
          );

        if (noExistingItemAction === "invalidate") {
          reactQueryClient.invalidateQueries({ queryKey });
          return existingItems;
        }

        return [item, ...existingItems];
      });
    }
    // Item removal
    else {
      // console.log('removing', itemId, queryKey)
      setTypedQueryData({ queryKey }, (existingItems: TItem[] | undefined) =>
        existingItems?.filter((existingItem) => existingItem.id !== itemId),
      );
    }
  });
};
