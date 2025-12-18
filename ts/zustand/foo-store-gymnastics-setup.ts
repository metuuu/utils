import { create } from "zustand";
import { persist } from "zustand/middleware";
import ZustandUtils from "@/ts/zustand/ZustandUtils";

type Foo = {
  bar: boolean;
  baz: boolean;
};

const initialState: Foo = {
  bar: false,
  baz: false,
};

const fooActions = ZustandUtils.createActions<Foo>()((set) => ({
  updateFoo: (options: Partial<Foo>) =>
    set((state) => ({ ...state, ...options })),
}));

export type FooStore = Foo & ReturnType<typeof fooActions>;

export const useFooStoreGymnasticsSetup = create<FooStore>()(
  persist(
    (set, get, store) => ({
      ...initialState,
      ...fooActions(set, get, store),
    }),
    {
      name: "foo", // unique name for localStorage key
      partialize: (state) => state,
    }
  )
);
