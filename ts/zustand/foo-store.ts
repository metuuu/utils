import { create } from "zustand";
import { persist } from "zustand/middleware";

type Foo = {
  bar: boolean;
  baz: boolean;
};
type FooActions = {
  updateFoo: (options: Partial<Foo>) => void;
  reset: () => void;
};
export type FooStore = Foo & FooActions;

const initialState: Foo = {
  bar: false,
  baz: false,
};

export const useFooStore = create<FooStore>()(
  persist(
    (set) => ({
      ...initialState,
      updateFoo: (foo) => {
        set((state) => ({ ...state, ...foo }));
      },
      reset: () => {
        set((state) => ({ ...state, ...initialState }));
      },
    }),
    {
      name: "foo", // unique name for localStorage key
      // partialize: (state) => ({ bar: state.bar }), // Saving only part of the state to localStorage
    }
  )
);
