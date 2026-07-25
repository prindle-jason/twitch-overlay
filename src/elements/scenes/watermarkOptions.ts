import { localImages } from "../../utils/assets/images";
import { localSounds } from "../../utils/assets/sounds";
import { pickRandom } from "../../utils/random";
import type { ElementPosition } from "../../utils/positioning";

export interface WatermarkOption {
  label: string;
  imageUrl: string;
  position?: ElementPosition;
  duration?: number;
  fadeTime?: number;
  soundUrl?: string;
}

export const WATERMARK_OPTIONS = {
  activateWindows: {
    label: "Activate Windows",
    imageUrl: localImages.activateWindows,
    position: {
      align: "bottom-right",
      inset: 60,
    },
  },
  gettyImages: {
    label: "Getty Images",
    imageUrl: localImages.gettyImages,
    position: {
      align: "bottom-right",
      inset: {
        right: 0,
        bottom: 270,
      },
    },
  },
  hypercam: {
    label: "Hypercam",
    imageUrl: localImages.hypercam,
    position: {
      align: "top-left",
      inset: 0,
    },
  },
  notLive: {
    label: "NOT LIVE",
    imageUrl: localImages.notLive,
    position: {
      align: "top-left",
      inset: 50,
    },
  },
  seelWatermark: {
    label: "Seel",
    imageUrl: localImages.seelWatermark,
    position: {
      align: "bottom-right",
      inset: {
        right: 120,
        bottom: 180,
      },
    },
  },
  stockImage: {
    label: "Stock Image",
    imageUrl: localImages.stockImage,
    position: {
      align: "center",
    },
  },
  toBeContinued: {
    label: "To Be Continued",
    imageUrl: localImages.toBeContinued,
    soundUrl: localSounds.jojoToBeContinued,
    position: {
      align: "bottom-left",
      inset: {
        left: 60,
        bottom: 90,
      },
    },
  },
  viewerDiscretion: {
    label: "Viewer Discretion",
    imageUrl: localImages.viewerDiscretion,
    position: {
      align: "bottom-left",
      inset: 15,
    },
  },
} as const satisfies Record<string, WatermarkOption>;

export type WatermarkOptionKey = keyof typeof WATERMARK_OPTIONS;

type WatermarkPayloadFromKey = {
  watermarkKey: WatermarkOptionKey;
  imageUrl?: string;
  label?: string;
} & Partial<Omit<WatermarkOption, "label" | "imageUrl">>;

type WatermarkPayloadFromUrl = {
  imageUrl: string;
  watermarkKey?: WatermarkOptionKey;
  label?: string;
} & Partial<Omit<WatermarkOption, "label" | "imageUrl">>;

export type WatermarkScenePayload =
  | WatermarkPayloadFromKey
  | WatermarkPayloadFromUrl;

export interface ResolvedWatermarkConfig {
  label: string;
  imageUrl: string;
  position: ElementPosition;
  duration: number;
  fadeTime: number;
  soundUrl?: string;
}

export function resolveWatermarkConfig(
  payload?: WatermarkScenePayload,
): ResolvedWatermarkConfig {
  const optionKeys = Object.keys(WATERMARK_OPTIONS) as WatermarkOptionKey[];
  const randomKey = pickRandom(optionKeys);

  const selectedKey = payload?.watermarkKey ?? randomKey;
  const preset: WatermarkOption | undefined = WATERMARK_OPTIONS[selectedKey];

  const imageUrl = payload?.imageUrl ?? preset?.imageUrl;
  if (!imageUrl) {
    throw new Error(
      "WatermarkScene config error: provide payload.imageUrl or payload.watermarkKey that resolves to a preset.",
    );
  }

  const resolvedSoundUrl =
    typeof payload?.soundUrl === "string" && payload.soundUrl.trim().length > 0
      ? payload.soundUrl
      : typeof preset?.soundUrl === "string" &&
          preset.soundUrl.trim().length > 0
        ? preset.soundUrl
        : undefined;

  const position = payload?.position ??
    preset?.position ?? { align: "top-left" };

  return {
    label: payload?.label ?? preset?.label ?? "Custom Watermark",
    imageUrl,
    position,
    duration: payload?.duration ?? preset?.duration ?? 300000,
    fadeTime: payload?.fadeTime ?? preset?.fadeTime ?? 0.02,
    soundUrl: resolvedSoundUrl,
  };
}
