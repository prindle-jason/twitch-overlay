import { DataElement } from "../primitives/DataElement";
import { SoundElement } from "../../elements/primitives/SoundElement";
import { SoundOnPlayBehavior } from "../../elements/behaviors/SoundOnPlayBehavior";
import { logger } from "../../utils/logger";

interface DataAudioElementConfig {
  audioUrl: string;
}

/**
 * Data-driven audio element that wraps SoundElement.
 * Plays sound when initialized via SoundOnPlayBehavior child.
 */
export class DataAudioElement extends DataElement {
  private soundElement: SoundElement | null = null;

  constructor(config: DataAudioElementConfig) {
    super();
    logger.warn("[DataAudio] Created", { audioUrl: config.audioUrl });

    this.soundElement = new SoundElement(config.audioUrl);

    // Add sound-on-play behavior BEFORE adding to parent
    const soundOnPlay = new SoundOnPlayBehavior();
    this.soundElement.addChild(soundOnPlay as any);

    // Now add the sound element with its behavior child
    this.addChild(this.soundElement as any);
  }

  override async init(): Promise<void> {
    logger.warn("[DataAudio] init() called");
    await super.init();
  }

  override play(): void {
    logger.warn("[DataAudio] play() called");
    super.play();
  }
}
