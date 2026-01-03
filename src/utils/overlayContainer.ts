/**
 * Global access to the DOM overlay container for non-canvas rendered elements.
 */
let overlayContainer: HTMLElement | null = null;

export function setOverlayContainer(container: HTMLElement): void {
  overlayContainer = container;
}

export function getOverlayContainer(): HTMLElement {
  if (!overlayContainer) {
    throw new Error("Overlay container not initialized");
  }
  return overlayContainer;
}
