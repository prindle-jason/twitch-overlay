import { getImage, getSound } from "../utils/mediaLoader.js";
import { BaseEffect } from "./BaseEffect.js";

export class DvdBounceEffect extends BaseEffect {
  constructor({ W, H, spawn }) {
    super({ W, H, duration: -1 });
    this.spawn = spawn;
    this.logoW = 128;
    this.logoH = 56;
    this.x = Math.random() * (this.W - this.logoW);
    this.y = Math.random() * (this.H - this.logoH);
    this.dx = 2.0;
    this.dy = 2.0;
    this.hue = Math.random() * 360;
    this.hueIncrement = 0.5;
    this.finished = false;
    this.logo = getImage('dvdLogo');
  this.sound = null;
    this.sound.volume = 0.4;
  }

  isCorner(x, y) {
    const epsilon = 2;
    const atLeft   = x <= epsilon;
    const atRight  = x + this.logoW >= this.W - epsilon;
    const atTop    = y <= epsilon;
    const atBottom = y + this.logoH >= this.H - epsilon;
    return (atLeft && atTop) || (atRight && atTop) || (atLeft && atBottom) || (atRight && atBottom);
  }

  update(deltaTime) {
    super.update(deltaTime);
    const speedScale = deltaTime / 16.67;
    this.x += this.dx * speedScale;
    this.y += this.dy * speedScale;

    // Edge bounce logic
    if (this.x < 0) {
      this.x = 0;
      this.dx = Math.abs(this.dx);
    } else if (this.x + this.logoW > this.W) {
      this.x = this.W - this.logoW;
      this.dx = -Math.abs(this.dx);
    }
    if (this.y < 0) {
      this.y = 0;
      this.dy = Math.abs(this.dy);
    } else if (this.y + this.logoH > this.H) {
      this.y = this.H - this.logoH;
      this.dy = -Math.abs(this.dy);
    }

    if (this.isCorner(this.x, this.y)) {
      this.play();
      if (this.spawn) this.spawn("confetti");
      this.finished = true;
      this.state = "Finished";
    }
    this.hue = (this.hue + this.hueIncrement * speedScale) % 360;
  }

  async init() {
    this.sound = getSound('partyHorn');
    // ...existing code...
  }

    play() {
      try { this.sound.cloneNode().play(); } catch {}
    }

  draw(ctx) {
    ctx.save();
    ctx.filter = `hue-rotate(${this.hue}deg)`;
    if (this.logo) {
      ctx.drawImage(this.logo, this.x, this.y, this.logoW, this.logoH);
    } else {
      ctx.fillStyle = "#fff";
      ctx.fillRect(this.x, this.y, this.logoW, this.logoH);
    }
    ctx.restore();
  }
}
