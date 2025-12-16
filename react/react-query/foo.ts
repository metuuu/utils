import { reactQueryClient } from ".";
import {
  createMutationHook,
  createQueryHook,
  setTypedQueryData,
  updateGetQueryDataFromList,
} from "./react-query-utils";

const QUERY_KEY_ROOT = "foo";

// --- Queries ---
export const fooQueries = {
  get: ({ id }: { id?: string }) => ({
    queryKey: [QUERY_KEY_ROOT, "get", id],
    queryFn: () => Promise.resolve({ id, name: "test" }),
    enabled: !!id,
  }),
  list: (filters: any) => ({
    queryKey: [QUERY_KEY_ROOT, "list", filters],
    queryFn: () =>
      Promise.resolve([
        { id: "1", name: "test" },
        { id: "2", name: "test2" },
      ])
        // Inserting the items into the "get" query cache
        .then((items) => {
          updateGetQueryDataFromList({
            items: items,
            query: fooQueries.get,
          });
          return items;
        }),
  }),
};

// --- Mutations ---
export const fooMutations = {
  create: () => ({
    mutationFn: ({ name }: { name: string }) =>
      Promise.resolve({ id: "1", name }).then((createdItem) => {
        // Invalidate "list" query cache
        reactQueryClient.invalidateQueries({
          queryKey: [QUERY_KEY_ROOT, "list"],
        });
        // Update "get" query cache
        setTypedQueryData(
          fooQueries.get({ id: createdItem.id }),
          () => createdItem
        );
        return createdItem;
      }),
  }),
};

// --- Hooks ---
export const fooHooks = {
  useGet: createQueryHook(fooQueries.get),
  useCreate: createMutationHook(fooMutations.create),
};
