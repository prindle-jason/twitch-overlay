/**
 * State constants for Entity lifecycle management
 */
export const EntityState = {
  READY: 'ready',          // Constructed and ready to start
  PLAYING: 'playing',       // Active and updating
  PAUSED: 'paused',        // Temporarily stopped
  FINISHED: 'finished'      // Done, ready for removal
};