import ZustandUtils from "./ZustandUtils";
import { useFooStore } from "./foo-store";

const stores = {
  useFoo: ZustandUtils.createSelectors(useFooStore),
};

const zustand = {
  ...stores,

  waitForHydration: (callback: () => void) =>
    ZustandUtils.waitForHydration(Object.values(stores), callback),
};

export default zustand;
