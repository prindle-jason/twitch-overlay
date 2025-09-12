import { getImage, getSound } from "../utils/mediaLoader.js";
import { BaseEffect } from "./BaseEffect.js";
import { getFadeInOutProgress } from "../utils/progressUtils.js";

export class SsbmFailEffect extends BaseEffect {
  constructor({ W, H, duration = 3000 }) {
    super({ W, H, duration });
    this.img = getImage('ssbmFailure');
    this.imgX = (this.W - this.img.naturalWidth) / 2;
    this.imgY = (this.H - this.img.naturalHeight) / 2;
  this.sound = null;
  this.sound = getSound('ssbmFail');
  }

  play() {
    this.sound.play();
  }

  update(deltaTime) {
    super.update(deltaTime);
    // Sound playing logic has been moved to the play() method
  }

  draw(ctx) {
    const progress = this.duration > 0 ? this.elapsed / this.duration : 1;
    
    ctx.save();
    ctx.globalAlpha = getFadeInOutProgress(progress, 0.25);
    ctx.drawImage(this.img, this.imgX, this.imgY, this.img.naturalWidth, this.img.naturalHeight);
    ctx.restore();
  }
}
