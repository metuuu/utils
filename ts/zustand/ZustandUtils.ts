/* eslint-disable @typescript-eslint/no-explicit-any */
import { StoreApi, UseBoundStore } from "zustand";

// Creating actions
export type ZustandActionSetter<TState> = (
  partial: Partial<TState> | ((state: TState) => Partial<TState>),
  replace?: false
) => void;

const createActions =
  <TState>() =>
  <TActions>(
    actionsCreator: (
      set: ZustandActionSetter<TState>,
      get: () => TState,
      store: StoreApi<TState>
    ) => TActions
  ) =>
    actionsCreator;

// Selectors - https://zustand.docs.pmnd.rs/guides/auto-generating-selectors ("use" renamed to "select")
type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { select: { [K in keyof T]: () => T[K] } }
  : never;

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  const store = _store as WithSelectors<typeof _store>;
  store.select = {};
  for (const k of Object.keys(store.getState())) {
    (store.select as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  // return store as WithoutObjectKeys<typeof store>;
  return store;
};

// Hydration
type StoreWithPersist = {
  persist?: {
    hasHydrated: () => boolean;
    onFinishHydration: (fn: () => void) => (() => void) | void;
  };
};
const waitForHydration = (
  stores: readonly (object | StoreWithPersist)[],
  onHydrated: () => void
) => {
  const persistApis = stores
    .filter((store) => "persist" in store && store.persist !== undefined)
    .map((store) => (store as StoreWithPersist).persist!);

  if (persistApis.length === 0) {
    onHydrated();
    return;
  }

  const pendingApis = persistApis.filter(
    (persistApi) => !(persistApi.hasHydrated?.() ?? true)
  );

  if (pendingApis.length === 0) {
    onHydrated();
    return;
  }

  let remaining = pendingApis.length;
  let didNotify = false;
  let cancelled = false;

  const notify = () => {
    if (cancelled || didNotify) return;
    didNotify = true;
    onHydrated();
  };

  const cleanups = pendingApis.map((persistApi) => {
    const unsubscribe = persistApi.onFinishHydration?.(() => {
      if (remaining > 0) remaining -= 1;
      if (remaining === 0) notify();
    });
    if (!unsubscribe) {
      if (remaining > 0) remaining -= 1;
      if (remaining === 0) notify();
      return undefined;
    }
    return () => unsubscribe();
  });
  if (remaining === 0) notify();

  return () => {
    cancelled = true;
    cleanups.forEach((cleanup) => cleanup?.());
  };
};

const ZustandUtils = {
  createActions,
  createSelectors,
  waitForHydration,
};

export default ZustandUtils;
