// EffectManager.js
// Manages effect creation, state transitions, updates, and rendering

// import { ConfettiEffect } from "../effects/ConfettiEffect.js";
// import { DvdEffect } from "../effects/DvdEffect.js";
// import { XJasonEffect } from "../effects/XJasonEffect.js";
// import { BamUhOhEffect } from "../effects/BamUhOhEffect.js";
// import { BamSuccessEffect } from "../effects/BamSuccessEffect.js";
// import { SsbmFailEffect } from "../effects/SsbmFailEffect.js";
// import { SsbmSuccessEffect } from "../effects/SsbmSuccessEffect.js";
// import { ZeldaChestEffect } from "../effects/ZeldaChestEffect.js";

// Import new scene classes
import DvdBounceScene from "../scenes/DvdBounceScene.js";
import BamScene from "../scenes/BamScene.js";
import SsbmScene from "../scenes/SsbmScene.js";
import XJasonScene from "../scenes/XJasonScene.js";

// Import scene configs
import { basicSceneConfig } from "../configs/BasicSceneConfig.js";
import { childTestConfig } from "../configs/ChildTestConfig.js";

export class EffectManager {
  constructor({ W, H }) {
    this.W = W;
    this.H = H;
    this.loadingEffects = [];
    this.playingEffects = [];
    this.activeScenes = [];
    this.effectIdCounter = 0;
    // this.factories = {
    //   confetti: (opts) => new ConfettiEffect(opts),
    //   //dvdBounce: (opts) => new DvdEffect({ ...opts, spawn: (type) => this.spawn(type) }),
    //   //xJason: (opts) => new XJasonEffect(opts),
    //   success: (opts) => this.successFactory(opts),
    //   failure: (opts) => this.failureFactory(opts),
    //   //ssbmFail: (opts) => new SsbmFailEffect(opts),
    //   //ssbmSuccess: (opts) => new SsbmSuccessEffect(opts),
    //   //bamSuccess: (opts) => new BamSuccessEffect(opts),
    //   bamUhOh: (opts) => new BamUhOhEffect(opts),
    //   zeldaChest: (opts) => new ZeldaChestEffect(opts)
    // };

    // Scene factories for new entity system
    this.sceneFactories = {
      dvdBounce: (opts) => new DvdBounceScene(this.W, this.H, opts),
      bamSuccess: (opts) => BamScene.createSuccess(this.W, this.H, opts),
      bamFailure: (opts) => BamScene.createFailure(this.W, this.H, opts),
      ssbmSuccess: (opts) => SsbmScene.createSuccess(this.W, this.H, opts),
      ssbmFailure: (opts) => SsbmScene.createFailure(this.W, this.H, opts),
      xJason: (opts) => XJasonScene.create(this.W, this.H, opts),
      bamTest: (opts) => new BamScene(this.W, this.H, {
        ...opts,
        ...basicSceneConfig
      }),
      childTest: (opts) => new BamScene(this.W, this.H, {
        ...opts,
        ...childTestConfig
      })
    };
  }

  failureFactory(opts) {
    // Randomly pick between bamFailure and ssbmFailure scenes
    const failureTypes = ['bamFailure', 'ssbmFailure'];
    const randomType = failureTypes[Math.floor(Math.random() * failureTypes.length)];
    
    // Spawn the selected failure type
    this.spawn(randomType, opts);
    return null; // Don't return anything since spawn handles it
  }

  successFactory(opts) {
    const successTypes = ['bamSuccess', 'ssbmSuccess'];
    const randomType = successTypes[Math.floor(Math.random() * successTypes.length)];
    
    // Spawn the selected success type
    this.spawn(randomType, opts);
    return null; // Don't return anything since spawn handles it
  }

  spawn(type, opts) {
    // Check if it's a scene type first
    if (this.sceneFactories[type]) {
      const scene = this.sceneFactories[type]({ ...opts, id: ++this.effectIdCounter });
      this.activeScenes.push(scene);
      return;
    }

    // Fall back to old effect system
    if (!type || !this.factories[type]) {
      // Optionally handle unknown effect type
      return;
    }
    const effect = this.factories[type]({ ...opts, W: this.W, H: this.H, id: ++this.effectIdCounter });
    
    // Handle factory methods that spawn internally (return null)
    if (effect === null) {
      return;
    }
    
    effect.init();
    this.loadingEffects.push(effect);
  }

  update(deltaTime) {
    // Move effects from loading to playing when ready
    this.loadingEffects = this.loadingEffects.filter((e) => {
      if (e.getState() === "Playing") {
        e.onPlay();
        this.playingEffects.push(e);
        return false;
      }
      return true;
    });

    // Update and remove finished effects in one loop
    this.playingEffects = this.playingEffects.filter((e) => {
      if (e.state === "Finished") {
        e.onFinish();
        return false;
      }
      e.update(deltaTime);
      return true;
    });

    // Update scenes and remove finished ones
    this.activeScenes = this.activeScenes.filter((scene) => {
      scene.update(deltaTime);
      return scene.state !== 'finished';
    });
  }

  draw(ctx) {
    // Draw old effects
    for (let i = 0; i < this.playingEffects.length; i++) {
      const e = this.playingEffects[i];
      e.draw(ctx);
    }

    // Draw new scenes
    for (let i = 0; i < this.activeScenes.length; i++) {
      const scene = this.activeScenes[i];
      scene.draw(ctx);
    }
  }

  clear() {
    this.loadingEffects = [];
    this.playingEffects = [];
    this.activeScenes = [];
  }
}
