// effects/HeadbladeEffect.js
import { BaseEffect } from "./BaseEffect.js";
import { ImageElement } from "../elements/ImageElement.js";
import { SoundElement } from "../elements/SoundElement.js";
import { SoundOnPlayBehavior } from "../behaviors/SoundOnPlayBehavior.js";
import { FallingBehavior } from "../behaviors/FallingBehavior.js";
import { TiltBehavior } from "../behaviors/TiltBehavior.js";
import { IntervalTimer } from "../utils/IntervalTimer.js";

export class HeadbladeEffect extends BaseEffect {
  constructor({ W, H, count = 30, duration = 15000 }) {
    super({ W, H, duration: duration });

    this.imageCount = count;
    this.spawnDuration = duration; // Only spawn during this time
    this.imageList = ["hb1", "hb2", "hb3", "hb4", "hb5"];

    // Initialize the image spawner
    this.imageSpawner = new IntervalTimer(
      duration / count, // interval: evenly distribute spawns over duration
      () => this.spawnHeadblade(), // callback
      count // maxCount
    );

    const sound = new SoundElement("headblade");
    sound.addBehavior(new SoundOnPlayBehavior());
    this.addElement(sound);
  }

  spawnHeadblade() {
    console.log("Spawning headblade");
    // Randomly select an image from the list
    const imageName =
      this.imageList[Math.floor(Math.random() * this.imageList.length)];
    const headblade = ImageElement.fromImage(imageName);
    headblade.x = Math.random() * this.W;
    headblade.y = -50;
    const scale = 0.5 * Math.random() + 0.25;
    headblade.scaleX = scale;
    headblade.scaleY = scale;
    headblade.rotation = Math.random() * Math.PI * 2;

    // Add falling physics with some randomness
    headblade.addBehavior(
      new FallingBehavior({
        velocityY: Math.random() * 80 + 60, // Initial downward velocity
        velocityX: (Math.random() - 0.5) * 120, // Random horizontal drift
        gravity: 400 + Math.random() * 200, // Gravity with variation
        drag: 0.01, // Slight air resistance
      })
    );

    // Add rotation with random speed and direction
    headblade.addBehavior(
      new TiltBehavior({
        rotationSpeed: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2), // Avoid near-zero: [-4,-2) or (2,4)
        wobbleAmount: 0, //Math.random() * 0.3, // Slight wobble
        wobbleSpeed: 0, //Math.random() * 2 + 1,
      })
    );

    this.addElement(headblade);
  }

  update(deltaTime) {
    // Handle image spawning with the timer
    this.imageSpawner.update(deltaTime);

    // Update all elements
    super.update(deltaTime);

    // Check if effect should finish early (all images spawned and off screen)
    // if (this.imageSpawner.isFinished() && this.elements.length === 0) {
    //   this.state = "Finished";
    // }
  }
}
