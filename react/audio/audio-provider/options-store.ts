import { create } from "zustand";
import { persist } from "zustand/middleware";
import ZustandUtils from "@/ts/zustand/ZustandUtils";

export type Options = {
  isAudioMuted: boolean;
  isMusicMuted: boolean;
};

const initialState: Options = {
  isAudioMuted: false,
  isMusicMuted: false,
};

const optionsActions = ZustandUtils.createActions<Options>()((set) => ({
  updateOptions: (options: Partial<Options>) =>
    set((state) => ({ ...state, ...options })),
}));

export type OptionsStore = Options & ReturnType<typeof optionsActions>;

export const useOptionsStore = create<OptionsStore>()(
  persist(
    (set, get, store) => ({
      ...initialState,
      ...optionsActions(set, get, store),
    }),
    {
      name: "options", // unique name for localStorage key
      partialize: (state) => ({
        isAudioMuted: state.isAudioMuted,
        isMusicMuted: state.isMusicMuted,
      }),
    }
  )
);
