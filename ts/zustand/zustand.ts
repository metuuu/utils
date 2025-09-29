import ZustandUtils from "./ZustandUtils";
import { useFooStore } from "./foo-store";

const stores = {
  useFoo: useFooStore,
};

const zustand = {
  use: {
    foo: ZustandUtils.createSelectors(useFooStore).use,
  },

  subscribe: {
    foo: ZustandUtils.createSelectors(useFooStore).subscribe,
  },

  // selectors: {
  //   foo: fooSelectors,
  // },

  hydration: {
    waitForHydration: (callback: () => void) =>
      ZustandUtils.waitForHydration(Object.values(stores), callback),
  },

  ...stores,
};

export default zustand;
