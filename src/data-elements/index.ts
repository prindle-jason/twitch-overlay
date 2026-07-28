/**
 * Central registry of all data-driven element types.
 * Imports all element classes and registers them with ElementRegistry.
 * Import this file once to auto-register all available elements.
 */

import { ElementRegistry } from "../data-systems/ElementRegistry";

// Composites
import { DataSchedulerElement } from "./composites/DataSchedulerElement";
import { DataRadialSpawnerElement } from "./composites/DataRadialSpawnerElement";

// Primitives
import { DataSoundElement } from "./primitives/DataSoundElement";
import {
  DataImageElement,
  DataStaticImageElement,
  DataAnimatedImageElement,
} from "./primitives/DataImageElement";
import { DataSequenceElement } from "./primitives/DataSequenceElement";
import { DataTransformElement } from "./primitives/DataTransformElement";

// Factories
import { DataImageElementFactory } from "../data-systems/DataImageElementFactory";

// Behaviors
import { DataVelocityBehavior } from "./behaviors/DataVelocityBehavior";
import { DataScreenBounceBehavior } from "./behaviors/DataScreenBounceBehavior";
import { DataSoundOnPlayBehavior } from "./behaviors/DataSoundOnPlayBehavior";
import { DataSceneElement } from "./scenes/DataSceneElement";

/**
 * Register all data-driven elements.
 * Called automatically when this module is imported.
 */
export function registerDataElements(): void {
  // Data-driven behaviors
  ElementRegistry.register("DataVelocityBehavior", DataVelocityBehavior);
  ElementRegistry.register(
    "DataScreenBounceBehavior",
    DataScreenBounceBehavior,
  );
  ElementRegistry.register("DataSoundOnPlayBehavior", DataSoundOnPlayBehavior);

  // Data-driven composites
  ElementRegistry.register("DataSchedulerElement", DataSchedulerElement);
  ElementRegistry.register(
    "DataRadialSpawnerElement",
    DataRadialSpawnerElement,
  );

  // Data-driven primitives
  ElementRegistry.register("DataSoundElement", DataSoundElement);
  // DataImageElement uses factory to detect static vs animated
  ElementRegistry.register("DataImageElement", DataImageElementFactory.create);
  // Subclasses available for explicit instantiation
  ElementRegistry.register("DataStaticImageElement", DataStaticImageElement);
  ElementRegistry.register(
    "DataAnimatedImageElement",
    DataAnimatedImageElement,
  );
  ElementRegistry.register("DataSequenceElement", DataSequenceElement);
  ElementRegistry.register("DataTransformElement", DataTransformElement);

  // Data-driven scenes
  ElementRegistry.register("DataSceneElement", DataSceneElement);
}

// Auto-register on import
registerDataElements();
