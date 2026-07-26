import { localImages } from "../../utils/assets/images";
import { localSounds } from "../../utils/assets/sounds";
import type { PoolType, SceneType } from "../../types/SceneTypes";

export type DvdType =
  | "dvd"
  | "bluRay"
  | "netflix"
  | "thx"
  | "gamecube"
  | "ps1"
  | "ps2"
  | "pedro"
  | "prndddX"
  | "headblade"
  | "discord"
  | "hamster";

export type DvdCornerHitEffect =
  | {
      kind: "scene";
      sceneType: SceneType;
      payload?: Record<string, unknown>;
    }
  | {
      kind: "pool";
      poolType: PoolType;
      payload?: Record<string, unknown>;
    }
  | {
      kind: "none";
    }
  | {
      kind: "sound";
      soundUrl: string;
    };

export const DEFAULT_DVD_CORNER_HIT_EFFECT: DvdCornerHitEffect = {
  kind: "scene",
  sceneType: "confetti",
};

export interface DvdOption {
  type: DvdType;
  weight: number;
  imageUrl: string;
  maxSize?: number;
  cornerHitEffect?: DvdCornerHitEffect;
}

export const DVD_OPTIONS: readonly DvdOption[] = [
  {
    type: "dvd",
    weight: 150,
    imageUrl: localImages.dvdLogo,
    cornerHitEffect: {
      kind: "scene",
      sceneType: "confetti",
      payload: { soundUrl: localSounds.partyHorn },
    },
  },
  {
    type: "bluRay",
    weight: 30,
    imageUrl: localImages.bluRayLogo,
    cornerHitEffect: {
      kind: "scene",
      sceneType: "confetti",
      payload: { soundUrl: localSounds.yippee },
    },
  },
  {
    type: "netflix",
    weight: 10,
    imageUrl: localImages.netflixLogo,
    cornerHitEffect: {
      kind: "sound",
      soundUrl: localSounds.netflixSound,
    },
  },
  {
    type: "thx",
    weight: 3,
    imageUrl: localImages.thxLogo,
    cornerHitEffect: {
      kind: "sound",
      soundUrl: localSounds.thxSound,
    },
  },
  {
    type: "gamecube",
    weight: 5,
    imageUrl: localImages.gamecubeLogo,
    maxSize: 60,
    cornerHitEffect: {
      kind: "sound",
      soundUrl: localSounds.gamecubeSound,
    },
  },
  {
    type: "ps1",
    weight: 5,
    imageUrl: localImages.ps1Logo,
    maxSize: 60,
    cornerHitEffect: {
      kind: "sound",
      soundUrl: localSounds.ps1Sound,
    },
  },
  {
    type: "ps2",
    weight: 5,
    imageUrl: localImages.ps2Logo,
    maxSize: 60,
    cornerHitEffect: {
      kind: "sound",
      soundUrl: localSounds.ps2Sound,
    },
  },
  {
    type: "pedro",
    weight: 1,
    maxSize: 60,
    imageUrl:
      "https://cdn.betterttv.net/emote/662475f6407bff50d709a67d/3x.webp",
    cornerHitEffect: {
      kind: "scene",
      sceneType: "confetti",
      payload: {
        count: 300,
        duration: 15 * 1000,
        imageUrls: [
          "https://cdn.betterttv.net/emote/662475f6407bff50d709a67d/3x.webp",
        ],
        soundUrl: localSounds.prndddo,
      },
    },
  },
  {
    type: "prndddX",
    weight: 1,
    maxSize: 60,
    imageUrl:
      "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_9bf0d3ff8fec4b7b8e315f00f37995e6/animated/light/3.0",
    cornerHitEffect: {
      kind: "scene",
      sceneType: "xJason",
    },
  },
  {
    type: "headblade",
    weight: 1,
    maxSize: 60,
    imageUrl: localImages.hb1,
    cornerHitEffect: {
      kind: "scene",
      sceneType: "headblade",
    },
  },
  {
    type: "discord",
    weight: 1,
    imageUrl: localImages.discordLogo,
    maxSize: 60,
    cornerHitEffect: {
      kind: "sound",
      soundUrl: localSounds.discordSound,
    },
  },
  {
    type: "hamster",
    weight: 1,
    imageUrl: localImages.mkHamster,
    maxSize: 60,
    cornerHitEffect: {
      kind: "sound",
      soundUrl: localSounds.mkInsane,
    },
  },
  //   {
  //     type: "example",
  //     imageUrl: localImages.bubSuccess,
  //     weight: 20,
  //     cornerHitEffect: {
  //       kind: "pool",
  //       poolType: "success",
  //     },
  //   },
];

export function isDvdType(value: unknown): value is DvdType {
  return (
    typeof value === "string" &&
    DVD_OPTIONS.some((option) => option.type === value)
  );
}
