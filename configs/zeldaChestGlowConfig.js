// configs/zeldaChestGlowConfig.js
// Sample configurations for GlowBeamElement used in Zelda chest effects

import { AngleVariationBehavior } from '../behaviors/AngleVariationBehavior.js';

export const zeldaChestGlowConfig = {
  // Main central beam - straight up from chest
  mainBeam: {
    x: 0, // Will be set to chest center X at runtime
    y: 0, // Will be set to chest opening Y at runtime
    length: 500,
    baseWidth: 150,
    angle: Math.PI, // Straight up
    color: 'rgba(250, 46, 223, 1)', // Warm golden glow
    intensity: 1,
    opacity: 0.8,
    blur: 0,
    fadeDistance: 0.6,
    behaviors: [
      new AngleVariationBehavior({ 
        limit: Math.PI / 6,  // 30 degrees in radians (π/6 ≈ 0.524)
        delta: Math.PI / 12  // 15 degrees in radians (π/12 ≈ 0.261)
      })
    ]
  },

  // Side beams - angled outward for magical effect
  leftBeam: {
    x: 0, // Will be set at runtime
    y: 0, // Will be set at runtime
    length: 120,
    baseWidth: 25,
    angle: -0.4, // ~23 degrees left
    color: 'rgba(255, 240, 120, 1)', // Slightly more yellow
    intensity: 0.7,
    opacity: 0.6,
    blur: 12,
    fadeDistance: 0.7
  },

  rightBeam: {
    x: 0, // Will be set at runtime
    y: 0, // Will be set at runtime
    length: 120,
    baseWidth: 25,
    angle: 0.4, // ~23 degrees right
    color: 'rgba(255, 240, 120, 1)', // Slightly more yellow
    intensity: 0.7,
    opacity: 0.6,
    blur: 12,
    fadeDistance: 0.7
  },

  // Smaller accent beams for extra sparkle
  accentBeams: [
    {
      x: 0, y: 0,
      length: 80,
      baseWidth: 15,
      angle: -0.8, // ~46 degrees left
      color: 'rgba(255, 255, 200, 1)',
      intensity: 0.5,
      opacity: 0.4,
      blur: 8,
      fadeDistance: 0.8
    },
    {
      x: 0, y: 0,
      length: 80,
      baseWidth: 15,
      angle: 0.8, // ~46 degrees right
      color: 'rgba(255, 255, 200, 1)',
      intensity: 0.5,
      opacity: 0.4,
      blur: 8,
      fadeDistance: 0.8
    },
    {
      x: 0, y: 0,
      length: 60,
      baseWidth: 12,
      angle: -0.2, // ~11 degrees left
      color: 'rgba(255, 255, 180, 1)',
      intensity: 0.4,
      opacity: 0.3,
      blur: 6,
      fadeDistance: 0.9
    },
    {
      x: 0, y: 0,
      length: 60,
      baseWidth: 12,
      angle: 0.2, // ~11 degrees right
      color: 'rgba(255, 255, 180, 1)',
      intensity: 0.4,
      opacity: 0.3,
      blur: 6,
      fadeDistance: 0.9
    }
  ]
};

// Animation phases - how beam properties change during chest opening
export const zeldaGlowAnimationPhases = {
  // During chest fade-in (before opening)
  fadeIn: {
    intensityMultiplier: 0.2, // Very dim glow
    opacityMultiplier: 0.3,
    lengthMultiplier: 0.5 // Shorter beams
  },

  // During chest opening animation
  opening: {
    intensityMultiplier: 0.8, // Building up
    opacityMultiplier: 0.7,
    lengthMultiplier: 0.8
  },

  // When chest is fully open
  opened: {
    intensityMultiplier: 1.0, // Full intensity
    opacityMultiplier: 1.0,
    lengthMultiplier: 1.0
  },

  // Pulsing/shimmering effect when chest is open
  shimmer: {
    intensityVariation: 0.3, // ±30% intensity variation
    opacityVariation: 0.2,   // ±20% opacity variation
    angleVariation: 0.1,     // ±0.1 radian angle variation
    pulseSpeed: 2000         // 2 second pulse cycle
  }
};

// Rupee-specific glow colors
export const rupeeGlowColors = {
  green: 'rgba(100, 255, 100, 1)',
  blue: 'rgba(100, 150, 255, 1)',
  red: 'rgba(255, 100, 100, 1)',
  default: 'rgba(255, 255, 150, 1)' // Golden
};

// Quick preset for a single beam (simplified usage)
export const singleBeamPreset = {
  x: 0,
  y: 0,
  length: 150,
  baseWidth: 35,
  angle: 0,
  color: 'rgba(255, 255, 150, 1)',
  intensity: 0.8,
  opacity: 0.7,
  blur: 12,
  fadeDistance: 0.6
};
