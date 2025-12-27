// effects/BamUhOhEffect.js
import { ConvergingSlideEffect } from "./ConvergingSlideEffect.js";

export class BamUhOhEffect extends ConvergingSlideEffect {
  constructor({ W, H, duration = 5000 }) {
    super({
      W,
      H,
      duration,
      left: { imageKey: "bubFailure" },
      right: { imageKey: "bobFailure" },
      soundKey: "bamUhOh",
      scale: 0.25,
      fadeTime: 0.2,
    });
  }
}
