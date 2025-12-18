import ZustandUtils from "./ZustandUtils";
import { useFooStoreGymnasticsSetup } from "./foo-store-gymnastics-setup";
import { useFooStore } from "./foo-store";

const stores = {
  useFooStore: ZustandUtils.createSelectors(useFooStore),
  useFooStoreGymnasticsSetup: ZustandUtils.createSelectors(
    useFooStoreGymnasticsSetup
  ),
};

const zustand = {
  ...stores,

  waitForHydration: (callback: () => void) =>
    ZustandUtils.waitForHydration(Object.values(stores), callback),
};

export default zustand;
