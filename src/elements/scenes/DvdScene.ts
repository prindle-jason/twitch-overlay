import { EventBus } from "../../core/EventBus";
import { TriggerableSceneElement } from "./SceneElement";
import { DvdElement } from "../composites/DvdElement";
import type { DvdCornerHitEffect } from "../composites/dvdOptions";
import type { SpawnIntentDetail } from "../../types/EventTypes";

/**
 * DvdScene manages multiple DVD logos that bounce around the screen.
 * Instead of creating a new scene for each DVD, they all share one scene instance.
 * This allows for centralized control and potential interactions between DVDs.
 */
export class DvdScene extends TriggerableSceneElement {
  readonly type = "dvdBounce" as const;

  private handleDvdHitCorner = ({ instance }: { instance: unknown }): void => {
    if (this.getState() === "FINISHED") {
      return;
    }

    if (!(instance instanceof DvdElement)) {
      return;
    }

    if (!this.getChildrenOfType(DvdElement).includes(instance)) {
      return;
    }

    const effect = instance.getCornerHitEffect();
    const spawnIntent = this.toSpawnIntent(effect);
    if (spawnIntent) {
      EventBus.emit("spawn-intent", spawnIntent);
    }
  };

  constructor() {
    super();
    this.duration = -1;
  }

  override async init() {
    if (this.getState() !== "NEW") {
      return;
    }

    EventBus.on("dvd-hit-corner", this.handleDvdHitCorner);
    this.addChild(new DvdElement());
    await super.init();
  }

  handleTrigger(payload?: unknown): void {
    //Add a new DVD
    this.addChild(new DvdElement());
  }

  override finish(): void {
    EventBus.off("dvd-hit-corner", this.handleDvdHitCorner);
    super.finish();
  }

  private toSpawnIntent(effect: DvdCornerHitEffect): SpawnIntentDetail | null {
    switch (effect.kind) {
      case "scene": {
        return {
          kind: "scene",
          sceneType: effect.sceneType,
          payload: effect.payload,
        };
      }

      case "pool": {
        return {
          kind: "pool",
          poolType: effect.poolType,
          payload: effect.payload,
        };
      }

      case "none":
        return null;

      case "sound":
        return null;
    }
  }
}
