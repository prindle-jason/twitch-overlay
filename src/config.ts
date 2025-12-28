export interface CanvasConfig {
  W: number;
  H: number;
}

export const canvasConfig: CanvasConfig = {
  W: 1920,
  H: 1080,
};

export function getCanvasConfig(): CanvasConfig {
  return canvasConfig;
}
