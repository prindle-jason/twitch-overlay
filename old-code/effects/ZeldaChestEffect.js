// effects/ZeldaChestEffect.js
import { BaseEffect } from './BaseEffect.js';
import { ImageElement } from '../elements/ImageElement.js';
import { SoundElement } from '../elements/SoundElement.js';
import { GlowBeamElement } from '../elements/GlowBeamElement.js';
import { getSoundDuration } from '../core/mediaLoader.js';
import { IntervalTimer } from '../utils/IntervalTimer.js';
import { FallingBehavior } from '../behaviors/FallingBehavior.js';
import { TiltBehavior } from '../behaviors/TiltBehavior.js';
import { ImageScaleBehavior } from '../behaviors/ImageScaleBehavior.js';
import { zeldaChestGlowConfig } from '../configs/zeldaChestGlowConfig.js';

export class ZeldaChestEffect extends BaseEffect {
  constructor({ W, H }) {
    // Initially call super with duration -1, we'll overwrite it immediately
    super({ W, H, duration: -1 });

    this.setupDurationConfig();
    this.setupContentConfig();
    this.setupPhaseConfig();
    this.setupElements();
    
    // Positioning and scaling properties
    this.chestScale = 0.4; // Adjust this to scale the entire chest
    this.chestBottomOffset = 20; // How much of the chest bottom can be off-screen (pixels)

    // Calculate positioning for all elements
    this.calculatePositioning();
  }
  
  /**
   * Setup duration configuration and calculate total effect duration
   */
  setupDurationConfig() {
    // Calculate sound durations as class variables
    this.openChestDuration = getSoundDuration('zeldaOpenChest');
    this.getItemDuration = getSoundDuration('zeldaGetItem');
    this.durationBuffer = 1000;
    
    // Set the actual duration
    this.duration = this.openChestDuration + this.getItemDuration + this.durationBuffer;
  }
  
  /**
   * Setup chest content configuration and selection
   */
  setupContentConfig() {
    // Weighted list of possible chest contents
    this.contentWeights = {
      rupees: 100,     // 100% chance for now
      // hearts: 0,    // Future content types
      // items: 0,     // Future content types
    };
    
    // Rupee types for random selection
    this.rupeeTypes = ['greenRupee', 'blueRupee', 'redRupee'];
    
    // Select content for this chest opening
    this.selectedContent = this.selectChestContents();
  }
  
  /**
   * Select chest contents based on weighted probabilities
   */
  selectChestContents() {
    const totalWeight = Object.values(this.contentWeights).reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const [contentType, weight] of Object.entries(this.contentWeights)) {
      currentWeight += weight;
      if (random <= currentWeight) {
        console.log(`Chest selected content: ${contentType}`);
        return contentType;
      }
    }
    
    // Fallback to first content type
    return Object.keys(this.contentWeights)[0];
  }
  
  /**
   * Create and configure all elements used in the effect
   */
  setupElements() {
    this.lid1 = new ImageElement('zeldaChestLid1');
    this.lid2 = new ImageElement('zeldaChestLid2');
    this.lid3 = new ImageElement('zeldaChestLid3');
    
    this.chestBody = new ImageElement('zeldaChestBody');

    this.openChestSound = new SoundElement('zeldaOpenChest');
    this.getItemSound = new SoundElement('zeldaGetItem');

    // Create glow beam using config
    this.glowBeam = new GlowBeamElement(zeldaChestGlowConfig.mainBeam);

    // Track active rupees for cleanup
    this.activeRupees = [];
    this.rupeeIntervalSpawner = null;
  }
  
  /**
   * Setup phase configuration with embedded functions
   */
  setupPhaseConfig() {
    this.phaseConfig = {
      fadeIn: {
        start: 0,
        duration: 2000,
        description: "Fade in + open chest sound",
        started: false,
        onStart: () => this.fadeInStart(),
        onUpdate: () => this.fadeInUpdate()
      },
      lidSwitch2: {
        start: 3000,
        description: "Switch to lid2 + add chest body",
        started: false,
        onStart: () => this.lidSwitch2Start()
        // No onUpdate needed for instant actions
      },
      lidSwitch3: {
        start: this.openChestDuration,
        description: "Chest opens fully + get item sound + spawn contents",
        started: false,
        onStart: () => this.chestOpensStart()
      }
    };
  }
  
  /**
   * Check if a phase should trigger based on current elapsed time
   */
  shouldTriggerPhase(phaseName) {
    const phase = this.phaseConfig[phaseName];
    return phase && phase.start !== null && this.elapsed >= phase.start;
  }
  
  /**
   * Get current phase progress (0-1) for phases with duration
   */
  getPhaseProgress(phaseName) {
    const phase = this.phaseConfig[phaseName];
    if (!phase || !phase.duration || this.elapsed < phase.start) return 0;
    
    const phaseElapsed = this.elapsed - phase.start;
    return Math.min(1, phaseElapsed / phase.duration);
  }
  
  /**
   * Calculate proper positioning once images are loaded
   */
  calculatePositioning() {
    if (!this.lid1.image || !this.chestBody.image) return;
    
    // Apply scale and position to all lid images identically
    const lids = [this.lid1, this.lid2, this.lid3];
    lids.forEach(lid => {
      lid.scaleX = this.chestScale;
      lid.scaleY = this.chestScale;
      
      // Position at bottom of screen, centered horizontally
      const lidWidth = lid.getWidth();
      const lidHeight = lid.getHeight();
      
      lid.x = this.W / 2 - lidWidth / 2; // Center horizontally
      lid.y = this.H - lidHeight + this.chestBottomOffset; // Bottom of image at bottom of screen
    });
    
    // Position chest body identically to the lids
    this.chestBody.scaleX = this.chestScale;
    this.chestBody.scaleY = this.chestScale;
    
    const bodyWidth = this.chestBody.getWidth();
    const bodyHeight = this.chestBody.getHeight();
    
    this.chestBody.x = this.W / 2 - bodyWidth / 2; // Center horizontally
    this.chestBody.y = this.H - bodyHeight + this.chestBottomOffset; // Bottom of image at bottom of screen

    // Position glow beam at chest center
    this.glowBeam.x = this.chestBody.x + bodyWidth / 2; // Center horizontally
    this.glowBeam.y = this.chestBody.y - 500; // Slightly below chest top
  }
  
  update(deltaTime) {
    super.update(deltaTime);
    
    // Handle rupee interval spawning
    if (this.rupeeIntervalSpawner) {
      this.rupeeIntervalSpawner.update(deltaTime);
    }
    
    // Clean up off-screen rupees
    this.activeRupees = this.activeRupees.filter(rupee => {
      if (rupee.isOffScreen && rupee.isOffScreen(this.W, this.H)) {
        this.removeElement(rupee);
        return false;
      }
      return true;
    });
    
    // Handle phase-based logic
    this.handlePhases();
  }
  
  /**
   * Handle all phase-based logic in one organized place
   */
  handlePhases() {
    for (const [phaseName, config] of Object.entries(this.phaseConfig)) {
      // Trigger phase start
      if (this.shouldTriggerPhase(phaseName) && !config.started) {
        config.onStart?.(); // Call the start function
        config.started = true;
      }
      
      // Handle ongoing updates for phases with duration
      if (config.started && config.duration && config.onUpdate) {
        config.onUpdate(); // Call the update function
      }
    }
  }
  
  // === PHASE METHODS ===
  
  /**
   * Phase: Fade in chest + play open chest sound
   */
  fadeInStart() {
    console.log('Starting Phase: Fade in + open chest sound');

    // Play open chest sound
    this.openChestSound.play();
    
    // Add lid1 to elements (will start invisible and fade in)
    this.currentLid = this.lid1;
    this.addElement(this.currentLid);
    
    // Add glow beam to elements for testing
    this.addElement(this.glowBeam);
    
    // Start with elements invisible
    this.currentLid.opacity = 0;
    this.chestBody.opacity = 0;
    this.glowBeam.opacity = 1;
  }
  
  /**
   * Update fade in progression
   */
  fadeInUpdate() {
    const progress = this.getPhaseProgress('fadeIn');
    
    // Apply fade in progression to lid, body, and glow beam
    this.currentLid.opacity = progress;
    this.chestBody.opacity = progress;
    //this.glowBeam.opacity = progress * 0.3; // Start with dimmer glow for testing
  }
  
  /**
   * Phase: Switch to lid2 + add chest body
   */
  lidSwitch2Start() {
    console.log('Starting Phase: Switch to lid2 + add chest body');
    
    this.removeElement(this.currentLid);
    this.currentLid = this.lid2;
    this.addElement(this.currentLid);
    
    this.addElement(this.chestBody); // Add chest body to elements
  }
  
  /**
   * Phase: Chest opens fully + get item sound + spawn contents
   */
  chestOpensStart() {
    console.log('Starting Phase: Chest opens fully + get item sound + spawn contents');
    console.log(`Spawning content type: ${this.selectedContent}`);
    
    this.removeElement(this.currentLid);
    this.currentLid = this.lid3;
    this.addElement(this.currentLid);
    
    this.getItemSound.play(); // Play get item sound
    
    // Spawn contents based on selected type
    this.spawnContents(this.selectedContent);
  }
  
  /**
   * Spawn contents based on the selected content type
   */
  spawnContents(contentType) {
    switch (contentType) {
      case 'rupees':
        this.spawnRupees(8, 30, 5);
        break;
      // Future content types:
      // case 'hearts':
      //   this.spawnHearts();
      //   break;
      // case 'items':
      //   this.spawnItems();
      //   break;
      default:
        console.warn(`Unknown content type: ${contentType}`);
    }
  }
  
  // === UTILITY METHODS ===
  
  /**
   * Spawn rupees with burst mode for initial spawn or interval mode for continuous spawning
   */
  spawnRupees(burstCount, interval, intervalCount) {    
    // Initial burst of rupees
    const initialBurstCount = 8;
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => this.spawnRupee(true), i * 100);
    }
    
    // Setup interval spawner for continuous spawning
    this.rupeeIntervalSpawner = new IntervalTimer(
      interval,  // interval: spawn every 300ms
      () => this.spawnRupee(false), // callback
      intervalCount    // maxCount: 15 additional rupees
    );
  }
  
  /**
   * Spawn a single rupee with physics
   * @param {boolean} isBurst - Whether this is part of the initial burst
   */
  spawnRupee(isBurst = false) {
    // Get chest position for spawning inside chest
    const chestCenterX = this.chestBody.x + this.chestBody.getWidth() / 2;
    const chestTopY = this.chestBody.y;
    
    // Spawn inside chest with some variance
    const spawnX = chestCenterX + (Math.random() - 0.5) * 40; // ±20px from center
    const spawnY = chestTopY + 10; // 10px below chest top
    
    // Randomly select a rupee type
    const randomRupeeType = this.rupeeTypes[Math.floor(Math.random() * this.rupeeTypes.length)];
    
    const rupee = new ImageElement(randomRupeeType);
    rupee.x = spawnX;
    rupee.y = spawnY;
    const rupeeScale = 0.1; // Random size variation
    
    // Add falling physics
    const velocityY = isBurst ? -(Math.random() * 100 + 600) : -(Math.random() * 100 + 400); // Initial upward velocity
    const velocityX = (Math.random() - 0.5) * 300; // Random horizontal velocity
    
    rupee.addBehavior(new FallingBehavior({
      velocityY,
      velocityX,
      gravity: 400 + Math.random() * 100, // Gravity with variation
      drag: 0.01 // Slight air resistance
    }));
    
    // Add rotation
    rupee.addBehavior(new TiltBehavior({
      rotationSpeed: (Math.random() - 0.5) * 8, // Random rotation
      wobbleAmount: Math.random() * 0.3,
      wobbleSpeed: Math.random() * 2 + 1
    }));

    rupee.addBehavior(new ImageScaleBehavior({ scaleX: rupeeScale, scaleY: rupeeScale }));

    rupee.onPlay();
    this.addElement(rupee);
    this.activeRupees.push(rupee);
  }

  draw(ctx) {
    // Custom draw order with rupee layering:
    // 1. Current lid (behind everything)
    // 2. Glow beam (over lid, behind chest body)
    // 3. Rising rupees (behind chest body)
    // 4. Chest body (middle layer)
    // 5. Falling rupees (in front of chest body)
    
    // Draw current lid first (if it exists)
    if (this.currentLid && this.elements.includes(this.currentLid)) {
      this.currentLid.draw(ctx);
    }
    
    // Draw glow beam over lid but behind chest body
    if (this.glowBeam && this.elements.includes(this.glowBeam)) {
      this.glowBeam.draw(ctx);
    }
    
    // Draw rising rupees (behind chest body)
    this.activeRupees.forEach(rupee => {
      const fallingBehavior = rupee.behaviors.find(b => b.constructor.name === 'FallingBehavior');
      if (fallingBehavior && fallingBehavior.velocityY < 0) { // Rising (negative velocity)
        rupee.draw(ctx);
      }
    });
    
    // Draw chest body on top of rising rupees (only if it's been added as an element)
    if (this.chestBody && this.elements.includes(this.chestBody)) {
      this.chestBody.draw(ctx);
    }
    
    // Draw falling rupees in front of chest body
    this.activeRupees.forEach(rupee => {
      const fallingBehavior = rupee.behaviors.find(b => b.constructor.name === 'FallingBehavior');
      if (fallingBehavior && fallingBehavior.velocityY >= 0) { // Falling (positive or zero velocity)
        rupee.draw(ctx);
      }
    });
  }
}
