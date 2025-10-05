/**
 * Entity lifecycle states
 * 
 * CONSTRUCTED: Constructor has finished, entity exists but not yet initialized
 * INITIALIZED: initialize() has been called, entity is ready to start
 * PLAYING: Active and updating, progression advances
 * PAUSED: Temporarily stopped (still renders if renderable, but no updates/progression)
 * FINISHED: Done, ready for cleanup and removal
 */
export enum EntityState {
  CONSTRUCTED = 'constructed',
  INITIALIZED = 'initialized', 
  PLAYING = 'playing',
  PAUSED = 'paused',
  FINISHED = 'finished'
}