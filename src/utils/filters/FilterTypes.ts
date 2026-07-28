/**
 * Valid CSS filter types.
 */
export enum FilterType {
  BLUR = "blur",
  BRIGHTNESS = "brightness",
  CONTRAST = "contrast",
  GRAYSCALE = "grayscale",
  HUE_ROTATE = "hue-rotate",
  INVERT = "invert",
  OPACITY = "opacity",
  SATURATE = "saturate",
  SEPIA = "sepia",
  //DROP_SHADOW = "drop-shadow",
}

/**
 * Map filter types to their CSS units.
 * Units are applied when generating the filter string.
 */
export const FILTER_UNITS: Record<FilterType, string> = {
  [FilterType.BLUR]: "px",
  [FilterType.BRIGHTNESS]: "%",
  [FilterType.CONTRAST]: "%",
  [FilterType.GRAYSCALE]: "%",
  [FilterType.HUE_ROTATE]: "deg",
  [FilterType.INVERT]: "%",
  [FilterType.OPACITY]: "%",
  [FilterType.SATURATE]: "%",
  [FilterType.SEPIA]: "%",
  //[FilterType.DROP_SHADOW]: "px", // drop-shadow is special: "drop-shadow(5px 5px 10px rgba(0,0,0,0.5))"
};
