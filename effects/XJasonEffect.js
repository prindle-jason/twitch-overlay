import { BaseEffect } from "./BaseEffect.js";
import { getFadeInOutProgress } from "../utils/progressUtils.js";
import { getImage } from "../utils/mediaLoader.js";

export class XJasonEffect extends BaseEffect {
  constructor({ W, H, duration = 3000 }) {
    super({ W, H, duration });
    // --- Tweakable constants ---
    this.POPUP_MIN_INTERVAL = 600;
    this.POPUP_MAX_INTERVAL = 1000;
    this.POPUP_MIN_DURATION = 900;
    this.POPUP_MAX_DURATION = 1400;
    this.POPUP_WIDTH = 560;
    this.POPUP_HEIGHT = 120;
    this.img = getImage('xJason');
    this.popups = [];
    this.lastPopupTime = 0;
    this.spawnInterval = this.POPUP_MIN_INTERVAL + Math.random() * (this.POPUP_MAX_INTERVAL - this.POPUP_MIN_INTERVAL);
  }

  spawnPopup() {
    const x = Math.random() * (this.W - this.POPUP_WIDTH);
    const y = Math.random() * (this.H - this.POPUP_HEIGHT);
    const duration = this.POPUP_MIN_DURATION + Math.random() * (this.POPUP_MAX_DURATION - this.POPUP_MIN_DURATION);
    this.popups.push({ t: 0, x, y, duration });
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Randomly spawn popups (every spawnInterval ms)
    this.lastPopupTime += deltaTime;
    if (this.lastPopupTime > this.spawnInterval) {
      this.spawnPopup();
      this.lastPopupTime = 0;
      this.spawnInterval = this.POPUP_MIN_INTERVAL + Math.random() * (this.POPUP_MAX_INTERVAL - this.POPUP_MIN_INTERVAL);
    }
    // Update popups
    for (const p of this.popups) {
      p.t += deltaTime;
    }
    // Remove finished popups
    this.popups = this.popups.filter(p => p.t < p.duration);
  }

  draw(ctx) {
    if (this.state !== "Playing") return;
    const w = this.POPUP_WIDTH, h = this.POPUP_HEIGHT;
    for (const p of this.popups) {
      const progress = Math.min(p.t / p.duration, 1);
      const x = p.x + (Math.random() - 0.5) * 12; //Add jitter
      const y = p.y + (Math.random() - 0.5) * 12; //Add jitter
      const alpha = getFadeInOutProgress(progress, 0.4);
      const blurPx = 16 * (1 - alpha);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.filter = `blur(${blurPx}px)`;
      ctx.drawImage(this.img, x, y, w, h);
      ctx.restore();
    }
  }
}
