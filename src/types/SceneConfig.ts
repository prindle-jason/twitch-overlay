/**
 * TypeScript interfaces for data-driven scene JSON schema.
 */

export interface SceneConfig {
  type: string;
  scene: ElementConfig;
}

export interface ElementConfig {
  elementType: string;
  id?: string;
  payload?: Record<string, unknown>;
}

export interface ElementWithChildren extends ElementConfig {
  payload?: Record<string, unknown> & {
    children?: ElementConfig[];
  };
}
