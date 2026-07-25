/**
 * TypeScript interfaces for data-driven scene JSON schema.
 * Note: JSON uses hyphenated keys (e.g., "root-elements") but this interface uses camelCase.
 * The factory handles the conversion when parsing JSON.
 */

export interface SceneConfig {
  type: string;
  rootElements: string[];
  elements: ElementConfig[];
}

export interface ElementConfig {
  type: string;
  id?: string;
  payload?: Record<string, unknown>;
}

export interface ElementWithChildren extends ElementConfig {
  payload?: Record<string, unknown> & {
    children?: ElementConfig[];
  };
}
