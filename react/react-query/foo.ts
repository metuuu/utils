// utils/meeting.ts
import { createQueryHook, createMutationHook } from "./react-query-utils";

const QUERY_KEY_ROOT = "foo";

// Base function
const meeting = {
  get: async ({ id }: { id: string }) => {
    return Promise.resolve("data");
  },

  create: async (input: any) => {
    return Promise.resolve("data");
  },
};

// --- Queries ---
export const fooQueries = {
  get: (id?: string) => ({
    queryKey: [QUERY_KEY_ROOT, id],
    queryFn: () => meeting.get({ id: id! }),
    enabled: !!id,
  }),
};

// --- Mutations ---
export const fooMutations = {
  create: () => ({
    mutationFn: (input: any) => meeting.create(input),
  }),
};

// --- Hooks ---
export const fooHooks = {
  useGet: (id?: string) => createQueryHook(fooQueries.get(id))(),
  useCreate: () => createMutationHook(fooMutations.create().mutationFn)(),
};
