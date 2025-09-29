// import { errorToMessage, isRetryableApiError } from "@/utils/error-utils";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { fooHooks, fooMutations, fooQueries } from "./foo";

export const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry max three times unless the error is something we don't want to / shouldn't retry
      retry: (failureCount, error) => {
        // if (isRetryableApiError(error)) return failureCount < 2;
        return false;
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      // console.debug("Query failed", query.queryKey, errorToMessage(error));
    },
  }),
});

const reactQuery = {
  foo: {
    ...fooHooks,
    queries: fooQueries,
    mutations: fooMutations,
  },
};

export default reactQuery;
