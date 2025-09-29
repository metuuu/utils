"use client";

import { useOptionsStore } from "./options-store";
import shuffleArray from "@/ts/randomization/shuffleArray";
import { Howl, Howler } from "howler";
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SoundEffectPlayOptions = {
  loop?: boolean;
  volume?: number;
  randomFade?: number;
};

type AudioEnvironment = "foo" | "bar";

type EnvironmentMusicConfig = {
  [key in AudioEnvironment]: string[];
};

type AudioContextValue = {
  backgroundMusic: {
    isMuted: boolean;
    play: () => void;
    stop: () => void;
    setMuted: (mute: boolean) => void;
  };
  soundEffects: {
    play: (
      file: string,
      options?: SoundEffectPlayOptions
    ) => { stop: () => void };
    stop: () => void;
  };
  environment: {
    current: AudioEnvironment;
    switchTo: (environment: AudioEnvironment) => void;
  };
  isMuted: boolean;
  setMuted: (mute: boolean) => void;
};

// Environment music configuration
const ENVIRONMENT_MUSIC: EnvironmentMusicConfig = {
  foo: ["assets/music/foo.mp3"],
  bar: ["assets/music/bar.mp3"],
};

// TODO: Do better. This is just a quick implementation.
export const globalAudio: {
  soundEffects: AudioContextValue["soundEffects"];
} & {
  backgroundMusic: Pick<AudioContextValue["backgroundMusic"], "play" | "stop">;
} & {
  environment: Pick<AudioContextValue["environment"], "switchTo">;
} = {
  backgroundMusic: undefined!,
  soundEffects: undefined!,
  environment: undefined!,
};

export const AudioContext = createContext<AudioContextValue>(
  null as unknown as AudioContextValue
);

const AudioProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { isAudioMuted, isMusicMuted, updateOptions } = useOptionsStore();

  // Environment state
  const [currentEnvironment, setCurrentEnvironment] =
    useState<AudioEnvironment>("foo");
  const [isPlaying, setIsPlaying] = useState(false);

  // Initial muting
  useEffect(() => {
    Howler.mute(isAudioMuted);
    return () => {
      Howler.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Background music
  const refBgMusicIndex = useRef(0);
  const refBgMusicPlaylist = useRef(
    shuffleArray(ENVIRONMENT_MUSIC[currentEnvironment])
  );
  const getBackgroundMusic = useCallback(
    (src: string) => {
      return new Howl({
        src,
        volume: 0.8,
        mute: isAudioMuted || isMusicMuted,
        loop: true,
        onend: () => {
          if (refBgMusicIndex.current < refBgMusicPlaylist.current.length - 1)
            refBgMusicIndex.current += 1;
          else refBgMusicIndex.current = 0;
          refBackgroundMusic.current = getBackgroundMusic(
            refBgMusicPlaylist.current[refBgMusicIndex.current]
          );
          if (isPlaying) {
            refBackgroundMusic.current.play();
          }
        },
      });
    },
    [isAudioMuted, isMusicMuted, isPlaying]
  );
  const refBackgroundMusic = useRef<Howl>(
    getBackgroundMusic(refBgMusicPlaylist.current[refBgMusicIndex.current])
  );
  const [soundEffects, setSoundEffects] = useState<Howl[]>([]);

  // Environment switching logic
  const switchEnvironment = useCallback(
    (newEnvironment: AudioEnvironment) => {
      if (newEnvironment === currentEnvironment) return;

      const wasPlaying = isPlaying;

      // Stop current music
      refBackgroundMusic.current.stop();

      // Update environment state
      setCurrentEnvironment(newEnvironment);

      // Update playlist for new environment
      refBgMusicPlaylist.current = shuffleArray(
        ENVIRONMENT_MUSIC[newEnvironment]
      );
      refBgMusicIndex.current = 0;

      // Create new music instance for the new environment
      refBackgroundMusic.current = getBackgroundMusic(
        refBgMusicPlaylist.current[refBgMusicIndex.current]
      );

      // If music was playing before switching, continue playing with new environment music
      if (wasPlaying) {
        refBackgroundMusic.current.play();
      }
    },
    [currentEnvironment, isPlaying, getBackgroundMusic]
  );

  // Update playlist when environment changes (for edge cases)
  useEffect(() => {
    refBgMusicPlaylist.current = shuffleArray(
      ENVIRONMENT_MUSIC[currentEnvironment]
    );
  }, [currentEnvironment]);

  //
  const audio = useMemo(
    () => ({
      backgroundMusic: {
        play: () => {
          setIsPlaying(true);
          refBackgroundMusic.current.play();
        },
        stop: () => {
          setIsPlaying(false);
          refBackgroundMusic.current.stop();
        },
        setMuted: (mute: boolean) => {
          refBackgroundMusic.current.mute(mute);
          updateOptions({ isMusicMuted: mute });
        },
      },
      soundEffects: {
        play: (file: string, options: SoundEffectPlayOptions = {}) => {
          if (!soundEffects)
            throw new Error('Sound effects "Audio" not initialized');
          const soundEffect = new Howl({
            src: `/assets/sound-effects/${file}`,
            preload: true,
            volume: options.volume,
            loop: options.loop,
          });

          if (options.randomFade) {
            const maxEnd = soundEffect.duration() - options.randomFade / 1000;
            soundEffect.seek(Math.random() * maxEnd);
            setTimeout(() => {
              soundEffect.fade(1, 0, options.randomFade!);
              setTimeout(() => {
                soundEffect.stop();
              }, options.randomFade);
            }, options.randomFade);
          }

          setSoundEffects((current) => [...current, soundEffect]);
          // Remove the audio from state after it is played
          soundEffect.on("end", () => {
            soundEffect.load();
            setSoundEffects((current) =>
              current.filter((audio) => audio !== soundEffect)
            );
          });
          soundEffect.play();
          return {
            stop: () => {
              soundEffect.stop();
            },
          };
        },
        stop: () => {
          if (!soundEffects)
            throw new Error('Sound effects "Audio" not initialized');
          soundEffects.forEach((soundEffect) => {
            soundEffect.stop();
          });
        },
      },
      environment: {
        current: currentEnvironment,
        switchTo: switchEnvironment,
      },
      setMuted: (mute: boolean) => {
        Howler.mute(mute);
        updateOptions({ isAudioMuted: mute });
      },
    }),
    [currentEnvironment, switchEnvironment, updateOptions, soundEffects]
  );

  useEffect(() => {
    globalAudio.backgroundMusic = audio.backgroundMusic;
    globalAudio.soundEffects = audio.soundEffects;
    globalAudio.environment = audio.environment;
  }, [audio]);

  return (
    <AudioContext.Provider
      value={{
        backgroundMusic: {
          isMuted: isMusicMuted,
          ...audio.backgroundMusic,
        },
        soundEffects: audio.soundEffects,
        environment: audio.environment,
        setMuted: audio.setMuted,
        isMuted: isAudioMuted,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export default AudioProvider;

export const useAudio = () => {
  return useContext(AudioContext);
};
