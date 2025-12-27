// effects/BamUhOhEffect.js
import { ConvergingSlideEffect } from "./ConvergingSlideEffect.js";

export class BamSuccessEffect extends ConvergingSlideEffect {
  constructor({ W, H, duration = 4000 }) {
    super({
      W,
      H,
      duration,
      left: { imageKey: "bubSuccess" },
      right: { imageKey: "bobSuccess" },
      soundKey: "bamHooray",
      scale: 0.25,
      fadeTime: 0.2,
    });
  }
}
