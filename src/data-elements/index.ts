/**
 * Central registry of all data-driven element types.
 * Imports all element classes and registers them with ElementRegistry.
 * Import this file once to auto-register all available elements.
 */

import { ElementRegistry } from "../systems/ElementRegistry";

// Composites
import { DataSchedulerElement } from "./composites/DataSchedulerElement";
import { DataRadialSpawnerElement } from "./composites/DataRadialSpawnerElement";

// Primitives
import { DataSoundElement } from "./primitives/DataSoundElement";
import { DataImageElement } from "./primitives/DataImageElement";

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
  ElementRegistry.register("DataImageElement", DataImageElement);

  // Data-driven scenes
  ElementRegistry.register("DataSceneElement", DataSceneElement);
}

// Auto-register on import
registerDataElements();
