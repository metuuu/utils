// utils/react-query-utils.ts
import { useQuery, useMutation } from "@tanstack/react-query";

export function createQueryHook<
  TQueryKey extends readonly unknown[],
  TQueryFn extends () => Promise<any>
>(options: { queryKey: TQueryKey; queryFn: TQueryFn; enabled?: boolean }) {
  return () => useQuery({ ...options });
}

export function createMutationHook<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  return () => useMutation({ mutationFn });
}
