import { ConvergingSlideEffect } from "./ConvergingSlideEffect";
// No interface needed; extends BaseEffect via ConvergingSlideEffect

interface BamSuccessEffectOptions {
  duration?: number;
}

export class BamSuccessEffect extends ConvergingSlideEffect {
  constructor(opts: BamSuccessEffectOptions = {}) {
    super({
      ...opts,
      left: { imageKey: "bubSuccess" },
      right: { imageKey: "bobSuccess" },
      soundKey: "bamHooray",
      scale: 0.25,
      fadeTime: 0.2,
    });
  }
}
