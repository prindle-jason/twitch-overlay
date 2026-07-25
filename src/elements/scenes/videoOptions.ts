import type { ElementPosition } from "../../utils/positioning";
import { localVideos } from "../../utils/assets/videos";

export type VideoSizeMode = "native" | "contain" | "cover" | "stretch";

export type VideoPosition = ElementPosition;

export interface VideoPreset {
  label: string;
  videoUrl: string;
  sizeMode: VideoSizeMode;
  width?: number;
  height?: number;
  muted?: boolean;
  loopCount?: number;
  fadeDurationMs?: number;
  position: ElementPosition;
}

export const VIDEO_PRESETS = {
  surfers: {
    label: "Surfers",
    videoUrl: localVideos.surfers,
    sizeMode: "contain",
    width: 270,
    height: 480,
    muted: false,
    loopCount: 1,
    fadeDurationMs: 5000,
    position: {
      align: "bottom-right",
      inset: 20,
    },
  },
  oiia: {
    label: "OIIA",
    videoUrl: localVideos.oiia,
    sizeMode: "contain",
    width: 270,
    height: 480,
    muted: false,
    loopCount: 3,
    fadeDurationMs: 5000,
    position: {
      align: "bottom-left",
      inset: 20,
    },
  },
  thePrndl: {
    label: "The Prndl",
    videoUrl: localVideos.thePrndl,
    sizeMode: "contain",
    width: 512,
    height: 512,
    muted: false,
    loopCount: 1,
    fadeDurationMs: 1000,
    position: {
      align: "center",
    },
  },
} as const satisfies Record<string, VideoPreset>;

export type VideoPresetKey = keyof typeof VIDEO_PRESETS;

type VideoScenePayloadFromKey = {
  videoKey: VideoPresetKey;
  videoUrl?: string;
  label?: string;
} & Partial<Omit<VideoPreset, "label" | "videoUrl">>;

type VideoScenePayloadFromUrl = {
  videoUrl: string;
  videoKey?: VideoPresetKey;
  label?: string;
} & Partial<Omit<VideoPreset, "label" | "videoUrl">>;

export type VideoScenePayload =
  | VideoScenePayloadFromKey
  | VideoScenePayloadFromUrl;

export function resolveVideoConfig(payload: VideoScenePayload): VideoPreset {
  const preset = payload.videoKey ? VIDEO_PRESETS[payload.videoKey] : undefined;

  const videoUrl = payload.videoUrl ?? preset?.videoUrl;
  if (!videoUrl) {
    throw new Error(
      "VideoScene config error: provide payload.videoUrl or payload.videoKey that resolves to a preset.",
    );
  }

  const sizeMode: VideoSizeMode =
    payload.sizeMode ?? preset?.sizeMode ?? "native";
  const width = payload.width ?? preset?.width;
  const height = payload.height ?? preset?.height;

  if (sizeMode === "stretch" && (width == null || height == null)) {
    throw new Error(
      "VideoScene config error: sizeMode 'stretch' requires both width and height.",
    );
  }

  return {
    label: payload.label ?? preset?.label ?? "Custom Video",
    videoUrl,
    sizeMode,
    width,
    height,
    muted: payload.muted ?? preset?.muted ?? false,
    loopCount: payload.loopCount ?? preset?.loopCount ?? 1,
    fadeDurationMs: payload.fadeDurationMs ?? preset?.fadeDurationMs,
    position: payload.position ??
      preset?.position ?? {
        align: "bottom-right",
        inset: 20,
      },
  };
}
