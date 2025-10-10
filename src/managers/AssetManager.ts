/**
 * AssetManager - Minimal image and audio loading with caching
 * 
 * Provides simple asset loading and caching for the MVP.
 * This is a simplified version focused on just what we need initially.
 */

interface LoadingPromise<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class AssetManager {
  private static instance: AssetManager;
  
  // Asset caches
  private imageCache = new Map<string, HTMLImageElement>();
  private audioCache = new Map<string, HTMLAudioElement>();
  
  // Loading coordination (prevent duplicate requests)
  private imageLoadingPromises = new Map<string, LoadingPromise<HTMLImageElement>>();
  private audioLoadingPromises = new Map<string, LoadingPromise<HTMLAudioElement>>();

  // Configuration
  private basePath: string = '/';
  private imagePath: string = 'images/';
  private audioPath: string = 'audio/';

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  // === Configuration ===

  /**
   * Set base path for all assets (defaults to '/')
   */
  setBasePath(path: string): void {
    this.basePath = path.endsWith('/') ? path : path + '/';
  }

  /**
   * Set image subfolder path (defaults to 'images/')
   */
  setImagePath(path: string): void {
    this.imagePath = path.endsWith('/') ? path : path + '/';
  }

  /**
   * Set audio subfolder path (defaults to 'audio/')
   */
  setAudioPath(path: string): void {
    this.audioPath = path.endsWith('/') ? path : path + '/';
  }

  // === Image Loading ===

  /**
   * Load an image by filename
   * Returns cached version if already loaded, otherwise loads and caches
   */
  async getImage(filename: string): Promise<HTMLImageElement> {
    // Check cache first
    const cached = this.imageCache.get(filename);
    if (cached) {
      return cached;
    }

    // Check if already loading
    const existingPromise = this.imageLoadingPromises.get(filename);
    if (existingPromise) {
      return existingPromise.promise;
    }

    // Create new loading promise
    const loadingPromise = this.createImageLoadingPromise(filename);
    this.imageLoadingPromises.set(filename, loadingPromise);

    try {
      const image = await loadingPromise.promise;
      
      // Cache the loaded image
      this.imageCache.set(filename, image);
      
      // Cleanup loading promise
      this.imageLoadingPromises.delete(filename);
      
      return image;
    } catch (error) {
      // Cleanup loading promise on error
      this.imageLoadingPromises.delete(filename);
      throw error;
    }
  }

  private createImageLoadingPromise(filename: string): LoadingPromise<HTMLImageElement> {
    const image = new Image();
    const url = this.basePath + this.imagePath + filename;
    
    let resolve: (value: HTMLImageElement) => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<HTMLImageElement>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    image.onload = () => {
      console.log(`✅ Loaded image: ${filename}`);
      resolve(image);
    };

    image.onerror = () => {
      const error = new Error(`Failed to load image: ${url}`);
      console.error(`❌ ${error.message}`);
      reject(error);
    };

    // Start loading
    image.src = url;

    return { promise, resolve: resolve!, reject: reject! };
  }

  // === Audio Loading ===

  /**
   * Load an audio file by filename
   * Returns cached version if already loaded, otherwise loads and caches
   */
  async getAudio(filename: string): Promise<HTMLAudioElement> {
    // Check cache first
    const cached = this.audioCache.get(filename);
    if (cached) {
      return cached.cloneNode() as HTMLAudioElement; // Return clone for concurrent playback
    }

    // Check if already loading
    const existingPromise = this.audioLoadingPromises.get(filename);
    if (existingPromise) {
      const audio = await existingPromise.promise;
      return audio.cloneNode() as HTMLAudioElement;
    }

    // Create new loading promise
    const loadingPromise = this.createAudioLoadingPromise(filename);
    this.audioLoadingPromises.set(filename, loadingPromise);

    try {
      const audio = await loadingPromise.promise;
      
      // Cache the loaded audio
      this.audioCache.set(filename, audio);
      
      // Cleanup loading promise
      this.audioLoadingPromises.delete(filename);
      
      // Return clone for playback
      return audio.cloneNode() as HTMLAudioElement;
    } catch (error) {
      // Cleanup loading promise on error
      this.audioLoadingPromises.delete(filename);
      throw error;
    }
  }

  private createAudioLoadingPromise(filename: string): LoadingPromise<HTMLAudioElement> {
    const audio = new Audio();
    const url = this.basePath + this.audioPath + filename;
    
    let resolve: (value: HTMLAudioElement) => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<HTMLAudioElement>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    audio.oncanplaythrough = () => {
      console.log(`🔊 Loaded audio: ${filename}`);
      resolve(audio);
    };

    audio.onerror = () => {
      const error = new Error(`Failed to load audio: ${url}`);
      console.error(`❌ ${error.message}`);
      reject(error);
    };

    // Start loading
    audio.src = url;
    audio.load();

    return { promise, resolve: resolve!, reject: reject! };
  }

  // === Preloading ===

  /**
   * Preload multiple images
   */
  async preloadImages(filenames: string[]): Promise<HTMLImageElement[]> {
    const promises = filenames.map(filename => this.getImage(filename));
    return Promise.all(promises);
  }

  /**
   * Preload multiple audio files
   */
  async preloadAudio(filenames: string[]): Promise<HTMLAudioElement[]> {
    const promises = filenames.map(filename => this.getAudio(filename));
    return Promise.all(promises);
  }

  // === Cache Management ===

  /**
   * Check if an image is cached
   */
  isImageCached(filename: string): boolean {
    return this.imageCache.has(filename);
  }

  /**
   * Check if an audio file is cached
   */
  isAudioCached(filename: string): boolean {
    return this.audioCache.has(filename);
  }

  /**
   * Clear all caches (useful for memory management)
   */
  clearCache(): void {
    this.imageCache.clear();
    this.audioCache.clear();
    console.log('🧹 AssetManager cache cleared');
  }

  // === Debug Info ===

  /**
   * Get cache statistics
   */
  getCacheStats(): { images: number; audio: number; loading: number } {
    return {
      images: this.imageCache.size,
      audio: this.audioCache.size,
      loading: this.imageLoadingPromises.size + this.audioLoadingPromises.size
    };
  }

  /**
   * List all cached assets
   */
  getCachedAssets(): { images: string[]; audio: string[] } {
    return {
      images: Array.from(this.imageCache.keys()),
      audio: Array.from(this.audioCache.keys())
    };
  }
}