import { Element } from "./Element";

export abstract class TransformElement extends Element {
  x = 0;
  y = 0;
  opacity = 1;
  scaleX = 1;
  scaleY = 1;
  rotation = 0;
  filter = "none";

  getWidth(): number {
    return -1; // Why???
  }

  getHeight(): number {
    return -1; // Why???
  }

  setScale(scale: number) {
    this.scaleX = scale;
    this.scaleY = scale;
  }
}
