// effects/ConfettiEffect.js
import { BaseEffect } from './BaseEffect.js';
import { EllipseElement } from '../elements/EllipseElement.js';
import { FallingBehavior } from '../behaviors/FallingBehavior.js';
import { TiltBehavior } from '../behaviors/TiltBehavior.js';
import { IntervalTimer } from '../utils/IntervalTimer.js';

export class ConfettiEffect extends BaseEffect {
  constructor({ W, H, count = 100, duration = 3000 }) {
    // Add buffer time for particles to fall off screen
    const bufferTime = 3000;
    super({ W, H, duration: duration + bufferTime });
    
    this.particleCount = count;
    this.spawnDuration = duration; // Only spawn during this time
    
    // Initialize the particle spawner
    this.particleSpawner = new IntervalTimer(
      duration / count,        // interval: evenly distribute spawns over duration
      () => this.spawnParticle(), // callback
      count                    // maxCount
    );
  }
  
  spawnParticle() {
    const particle = new EllipseElement({
      x: Math.random() * this.W,
      y: -10,
      radiusX: Math.random() * 6 + 4,
      radiusY: (Math.random() * 6 + 4) * 0.3, // Flattened ellipse for confetti look
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      rotation: Math.random() * Math.PI * 2
    });
    
    // Add falling physics with some randomness
    particle.addBehavior(new FallingBehavior({
      velocityY: Math.random() * 50 + 25, // Initial downward velocity
      velocityX: (Math.random() - 0.5) * 100, // Random horizontal drift
      gravity: 300 + Math.random() * 200, // Gravity with variation
      drag: 0.02 // Slight air resistance
    }));
    
    // Add rotation with random speed and direction
    particle.addBehavior(new TiltBehavior({
      rotationSpeed: (Math.random() - 0.5) * 6, // Random rotation speed and direction
      wobbleAmount: Math.random() * 0.5, // Slight wobble
      wobbleSpeed: Math.random() * 3 + 1
    }));
    
    this.addElement(particle);
  }
  
  update(deltaTime) {
    // Handle particle spawning with the timer
    this.particleSpawner.update(deltaTime);
    
    // Update all elements
    super.update(deltaTime);
    
    // Clean up off-screen particles
    this.elements = this.elements.filter(element => 
      !element.isOffScreen || !element.isOffScreen(this.W, this.H)
    );
    
    // Check if effect should finish early (all particles spawned and off screen)
    if (this.particleSpawner.isFinished() && this.elements.length === 0) {
      this.state = "Finished";
    }
  }
}
