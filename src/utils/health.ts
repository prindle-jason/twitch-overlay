export type HealthSnapshot = {
  timestamp: number;
  fps: number;
  frameMsAvg: number;
  effectsLoading: number;
  effectsPlaying: number;
  wsReadyState: number | null;
};

export class Health {
  private frames = 0;
  private accumulatedMs = 0;
  private fps = 0;
  private emaFrameMs = 16.67;
  private readonly alpha = 0.1;

  recordFrame(deltaMs: number) {
    this.frames += 1;
    this.accumulatedMs += deltaMs;
    this.emaFrameMs = this.alpha * deltaMs + (1 - this.alpha) * this.emaFrameMs;

    if (this.accumulatedMs >= 1000) {
      this.fps = (this.frames * 1000) / this.accumulatedMs;
      this.frames = 0;
      this.accumulatedMs = 0;
    }
  }

  snapshot(extra: {
    effectsLoading: number;
    effectsPlaying: number;
    wsReadyState: number | null;
  }): HealthSnapshot {
    return {
      timestamp: Date.now(),
      fps: Number(this.fps.toFixed(1)),
      frameMsAvg: Number(this.emaFrameMs.toFixed(2)),
      effectsLoading: extra.effectsLoading,
      effectsPlaying: extra.effectsPlaying,
      wsReadyState: extra.wsReadyState,
    };
  }
}
