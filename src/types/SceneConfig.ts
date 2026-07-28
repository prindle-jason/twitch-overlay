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
  duration?: number;
  eventListeners?: ChildEventListener[];
  children?: ElementConfig[];
  [key: string]: unknown;
}

export interface ChildEventListener {
  event: string;
  action: string;
  sourceId?: string;
  filter?: Record<string, unknown>;
}
