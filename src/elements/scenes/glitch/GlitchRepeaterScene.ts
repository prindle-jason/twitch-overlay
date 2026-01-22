import { SceneElement } from "../SceneElement";
import { pickRandom, getRandomIntInRange } from "../../../utils/random";
import type { Range } from "../../../utils/random";
import {
  SsbmSuccessScene,
  SsbmFailScene,
} from "../variants/CenteredImageScene";
import {
  BamSuccessScene,
  BamFailureScene,
} from "../variants/ConvergingSlideScene";
import { SchedulerElement } from "../../composites/SchedulerElement";

/**
 * Constructor type for a concrete SceneElement
 */
type SceneClass = new () => SceneElement;

/**
 * Repeatable scene with its configured duration
 */
interface RepeatableSceneData {
  sceneClass: SceneClass;
  sceneDuration: number;
}

// Repeatable scenes with their configured durations
const REPEATABLE_SCENES = [
  { sceneClass: SsbmSuccessScene, sceneDuration: 300 },
  { sceneClass: SsbmFailScene, sceneDuration: 350 },
  { sceneClass: BamSuccessScene, sceneDuration: 500 },
  { sceneClass: BamFailureScene, sceneDuration: 500 },
] as const satisfies readonly RepeatableSceneData[];

/**
 * Extract allowed scene class types from the repeatable scenes
 */
type RepeatableSceneClass = (typeof REPEATABLE_SCENES)[number]["sceneClass"];

/**
 * Configuration for scene repeater
 */
interface SceneRepeaterConfig {
  sceneClass?: RepeatableSceneClass; // Type-safe: only repeatable scenes allowed
  repeats?: number | Range; // number of times to repeat
}

/**
 * GlitchRepeaterScene plays a scene repeatedly with pauses between each play.
 * This creates a "stuttering" or "replay loop" effect where the same scene
 * is instantiated multiple times and played in rapid succession with brief pauses.
 */
export class GlitchRepeaterScene extends SceneElement {
  readonly type = "glitchRepeater" as const;

  private scheduler: SchedulerElement | null = null;
  private activeScene: SceneElement | null = null;
  private frozenScenes: SceneElement[] = [];

  private repeatableSceneData: RepeatableSceneData;
  private totalRepeats: number;
  private scenesSpawned = 0;

  constructor(config?: Partial<SceneRepeaterConfig>) {
    super();

    this.repeatableSceneData = config?.sceneClass
      ? REPEATABLE_SCENES.find(
          (entry) => entry.sceneClass === config.sceneClass,
        )!
      : pickRandom(REPEATABLE_SCENES);

    // Set repeats
    if (config?.repeats && typeof config.repeats === "number") {
      this.totalRepeats = config.repeats;
    } else if (config?.repeats && typeof config.repeats === "object") {
      this.totalRepeats = getRandomIntInRange(config.repeats);
    } else {
      this.totalRepeats = getRandomIntInRange({ min: 3, max: 7 });
    }
  }

  override async init(): Promise<void> {
    // Create scheduler to spawn scenes at intervals
    this.scheduler = new SchedulerElement({
      interval: this.repeatableSceneData.sceneDuration,
      count: this.totalRepeats,
      onTick: () => this.spawnNextScene(),
    });
    this.addChild(this.scheduler);

    await super.init();
  }
  /**
   * Draw previously spawned scenes that were frozen (removed from children).
   * These render behind the current children (active scene, scheduler).
   */
  protected override drawSelf(ctx: CanvasRenderingContext2D): void {
    for (const scene of this.frozenScenes) {
      scene.draw(ctx);
    }
  }
  /**
   * Spawn and play the next scene in the sequence
   */
  private spawnNextScene(): void {
    // Freeze the current active scene by removing it from children,
    // but keep drawing it manually so it remains visible without updating.
    if (this.activeScene) {
      this.activeScene.pause();
      this.removeChild(this.activeScene);
      this.frozenScenes.push(this.activeScene);
    }

    // Create a new instance of the configured scene class
    this.activeScene = new this.repeatableSceneData.sceneClass();
    this.addChild(this.activeScene);

    this.scenesSpawned += 1;

    // If this was the last scene, set our duration to end after it plays
    if (this.scenesSpawned >= this.totalRepeats) {
      this.duration = this.elapsed + this.repeatableSceneData.sceneDuration;
    }
  }

  /** Ensure frozen scenes are cleaned up when this repeater finishes. */
  override finish(): void {
    // Manually finish any frozen scenes (not children anymore)
    for (const scene of this.frozenScenes) {
      scene.finish();
    }
    this.frozenScenes = [];
    super.finish();
  }
}
