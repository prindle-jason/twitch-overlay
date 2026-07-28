import Ajv, { ValidateFunction } from "ajv/dist/2020";
import customSceneSchema from "../schema/custom-scene.schema.json";
import dataElementSchema from "../schema/elements/DataElement.schema.json";
import dataSceneElementSchema from "../schema/elements/DataSceneElement.schema.json";
import dataImageElementSchema from "../schema/elements/DataImageElement.schema.json";
import dataSoundElementSchema from "../schema/elements/DataSoundElement.schema.json";
import dataSchedulerElementSchema from "../schema/elements/DataSchedulerElement.schema.json";
import dataSoundOnPlayBehaviorSchema from "../schema/elements/DataSoundOnPlayBehavior.schema.json";
import { logger } from "./logger";

class SchemaValidator {
  private ajv: Ajv;
  private validateScene: ValidateFunction;
  private validateDataSceneElement: ValidateFunction;

  constructor() {
    this.ajv = new Ajv({ strict: false });

    // Register all schemas by their $id
    this.ajv.addSchema(dataElementSchema, "DataElement");
    this.ajv.addSchema(dataSceneElementSchema, "DataSceneElement");
    this.ajv.addSchema(dataImageElementSchema, "DataImageElement");
    this.ajv.addSchema(dataSoundElementSchema, "DataSoundElement");
    this.ajv.addSchema(dataSchedulerElementSchema, "DataSchedulerElement");
    this.ajv.addSchema(dataSoundOnPlayBehaviorSchema, "DataSoundOnPlayBehavior");

    // Compile the main schema validator
    this.validateScene = this.ajv.compile(customSceneSchema);

    // Compile DataSceneElement validator
    this.validateDataSceneElement = this.ajv.compile(dataSceneElementSchema);
  }

  /**
   * Validate a scene configuration against the schema.
   * Returns { valid: true } or { valid: false, errors: [...] }
   */
  validate(config: unknown): { valid: boolean; errors?: string[] } {
    const valid = this.validateScene(config);

    if (!valid) {
      const errors = this.ajv.errorsText(this.validateScene.errors, {
        dataVar: "scene",
        separator: "\n  ",
      });

      return {
        valid: false,
        errors: [errors],
      };
    }

    return { valid: true };
  }

  /**
   * Validate a DataSceneElement configuration.
   * Returns true if valid, false if invalid (logs warnings).
   */
  validateDataSceneElementAndWarn(config: unknown, context?: string): boolean {
    const valid = this.validateDataSceneElement(config);

    if (!valid) {
      const contextStr = context ? ` (${context})` : "";
      logger.warn(
        `[SchemaValidator] Scene config validation failed${contextStr}:`,
      );

      // Log only the first/root error to avoid spam
      if (this.validateDataSceneElement.errors && this.validateDataSceneElement.errors.length > 0) {
        const error = this.validateDataSceneElement.errors[0];
        logger.warn(`  Path: ${error.instancePath || "(root)"}`);
        logger.warn(`  Keyword: ${error.keyword}`);
        logger.warn(`  Message: ${error.message}`);
        if (error.params) {
          logger.warn(`  Params: ${JSON.stringify(error.params)}`);
        }
        logger.warn(`  Total errors: ${this.validateDataSceneElement.errors.length}`);
      }

      return false;
    }

    return true;
  }
}

// Export singleton instance
export const schemaValidator = new SchemaValidator();
