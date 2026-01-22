import { TriggerableSceneElement } from "./SceneElement";
import { ConfettiScene } from "./ConfettiScene";
import { DvdElement } from "../composites/DvdElement";

/**
 * DvdScene manages multiple DVD logos that bounce around the screen.
 * Instead of creating a new scene for each DVD, they all share one scene instance.
 * This allows for centralized control and potential interactions between DVDs.
 */
export class DvdScene extends TriggerableSceneElement {
  readonly type = "dvdBounce" as const;

  constructor() {
    super();
    this.duration = -1;
  }

  override async init() {
    this.addChild(new DvdElement());
    await super.init();
  }

  handleTrigger(payload?: unknown): void {
    //Add a new DVD
    this.addChild(new DvdElement());
  }

  private spawnConfetti(): void {
    this.addChild(new ConfettiScene());
  }

  protected override updateSelf(deltaTime: number): void {
    // Check for finished DVDs that have hit a corner and spawn confetti before they are removed
    this.getChildrenOfType(DvdElement).forEach((dvd) => {
      if (dvd.getState() === "FINISHED" && dvd.getHasHitCorner()) {
        this.spawnConfetti();
      }
    });
  }
}
