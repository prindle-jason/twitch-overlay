import { EventBus } from "../../core/EventBus";
import { TriggerableSceneElement } from "./SceneElement";
import { DvdElement } from "../composites/DvdElement";
import {
  isDvdType,
  type DvdCornerHitEffect,
  type DvdType,
} from "../composites/dvdOptions";
import type { SpawnIntentDetail } from "../../types/EventTypes";

/**
 * DvdScene manages multiple DVD logos that bounce around the screen.
 * Instead of creating a new scene for each DVD, they all share one scene instance.
 * This allows for centralized control and potential interactions between DVDs.
 */
export class DvdScene extends TriggerableSceneElement {
  readonly type = "dvdBounce" as const;
  private readonly initialRequestedType?: DvdType;

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

  constructor(payload?: unknown) {
    super();
    this.duration = -1;
    this.initialRequestedType = this.getRequestedType(payload);
  }

  override async init() {
    if (this.getState() !== "NEW") {
      return;
    }

    EventBus.on("dvd-hit-corner", this.handleDvdHitCorner);
    this.addChild(new DvdElement(this.initialRequestedType));
    await super.init();
  }

  handleTrigger(payload?: unknown): void {
    const requestedType = this.getRequestedType(payload);
    this.addChild(new DvdElement(requestedType));
  }

  private getRequestedType(payload: unknown): DvdType | undefined {
    if (!payload || typeof payload !== "object") {
      return undefined;
    }

    const dvdType = (payload as Record<string, unknown>).dvdType;
    return isDvdType(dvdType) ? dvdType : undefined;
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
