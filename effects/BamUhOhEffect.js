
import { BaseEffect } from "./BaseEffect.js";
import { getFadeInOutProgress } from "../utils/progressUtils.js";
import { getImage, getSound } from "../utils/mediaLoader.js";

export class BamUhOhEffect extends BaseEffect {
  constructor({ W, H, duration = 5000 }) {
    super({ W, H, duration });
    this.SCALE = 0.25;
    this.BUB_START_X = this.BUB_START_Y = this.BUB_END_X = this.BUB_END_Y = 0;
    this.imgW = this.imgH = 0;
    this.sound = null;
    this.bubImg = null;
    this.bobImg = null;
  }

  async init() {
  this.bubImg = getImage('bubFailure');
  this.bobImg = getImage('bobFailure');

  this.imgW = this.bubImg.naturalWidth * this.SCALE;
  this.imgH = this.bubImg.naturalHeight * this.SCALE;

  this.BUB_START_X = 0 - this.imgW;
  this.BUB_START_Y = this.H;
  this.BUB_END_X = 0;
  this.BUB_END_Y = this.H - this.imgH;

  this.sound = getSound('bamUhOh');
  await super.init();
  }

  play() {
    this.sound.play();
  }

  update(deltaTime) {
  super.update(deltaTime);
  }

  draw(ctx) {
    const progress = this.duration > 0 ? this.elapsed / this.duration : 1;
    const slide = 1 - getFadeInOutProgress(progress, 0.2);

    const y = this.BUB_START_Y + (this.BUB_END_Y - this.BUB_START_Y) * (1 - slide);
    const bubX = this.BUB_START_X + (this.BUB_END_X - this.BUB_START_X) * (1 - slide);
    const bobX = this.W - this.BUB_START_X - this.imgW + (-(this.BUB_END_X - this.BUB_START_X)) * (1 - slide);   

    ctx.drawImage(this.bubImg, bubX, y, this.imgW, this.imgH);
    ctx.drawImage(this.bobImg, bobX, y, this.imgW, this.imgH);
  }
}
