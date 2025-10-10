# AssetManager Architecture

## Overview
AssetManager provides centralized resource loading, caching, and cleanup for all assets used by entities. It ensures efficient resource usage, prevents duplicate loading, and manages memory properly throughout the application lifecycle.

## Core Responsibilities
- **Resource Loading**: Async loading of images, audio, and other assets
- **Caching Strategy**: Intelligent caching with reference counting
- **Memory Management**: Proper cleanup and disposal of unused assets
- **Error Handling**: Graceful fallbacks for missing or failed assets
- **Preloading**: Batch loading for scene initialization
- **Format Support**: Multiple formats with browser compatibility

## Key Design Principles
- **Async-First**: All loading operations are asynchronous and promise-based
- **Reference Counting**: Track asset usage for intelligent cleanup
- **Fail-Safe**: Continue operation even when assets fail to load
- **Performance Optimized**: Minimize memory usage and loading times
- **Development Friendly**: Clear error messages and debug information

## Core Implementation

### AssetManager Class
```typescript
interface AssetMetadata {
  url: string;
  type: AssetType;
  size?: number;
  lastAccessed: number;
  refCount: number;
  loadedAt: number;
}

enum AssetType {
  IMAGE = 'image',
  AUDIO = 'audio',
  JSON = 'json',
  TEXT = 'text'
}

interface LoadingPromise<T> {
  promise: Promise<T>;
  resolvers: Array<(value: T) => void>;
  rejectors: Array<(error: Error) => void>;
}

class AssetManager {
  private static instance: AssetManager;
  
  // Asset storage
  private imageCache = new Map<string, HTMLImageElement>();
  private audioCache = new Map<string, HTMLAudioElement>();
  private jsonCache = new Map<string, any>();
  private textCache = new Map<string, string>();
  
  // Metadata tracking
  private metadata = new Map<string, AssetMetadata>();
  
  // Loading coordination
  private loadingImages = new Map<string, LoadingPromise<HTMLImageElement>>();
  private loadingAudio = new Map<string, LoadingPromise<HTMLAudioElement>>();
  
  // Configuration
  private baseUrl: string = '';
  private maxCacheSize: number = 100 * 1024 * 1024; // 100MB default
  private enableLogging: boolean = false;

  private constructor() {}

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  // Configuration
  configure(options: {
    baseUrl?: string;
    maxCacheSize?: number;
    enableLogging?: boolean;
  }): void {
    this.baseUrl = options.baseUrl || '';
    this.maxCacheSize = options.maxCacheSize || this.maxCacheSize;
    this.enableLogging = options.enableLogging || false;
  }

  // Image Loading
  async getImage(path: string): Promise<HTMLImageElement> {
    const fullUrl = this.resolveUrl(path);
    
    // Check cache first
    if (this.imageCache.has(fullUrl)) {
      this.incrementRefCount(fullUrl);
      this.updateLastAccessed(fullUrl);
      return this.imageCache.get(fullUrl)!;
    }

    // Check if already loading
    if (this.loadingImages.has(fullUrl)) {
      return this.loadingImages.get(fullUrl)!.promise;
    }

    // Start loading
    const loadingPromise = this.createImageLoadingPromise(fullUrl);
    this.loadingImages.set(fullUrl, loadingPromise);

    try {
      const image = await loadingPromise.promise;
      
      // Cache successful load
      this.imageCache.set(fullUrl, image);
      this.recordMetadata(fullUrl, AssetType.IMAGE, this.estimateImageSize(image));
      
      this.loadingImages.delete(fullUrl);
      
      if (this.enableLogging) {
        console.log(`✓ Loaded image: ${path}`);
      }
      
      return image;
    } catch (error) {
      this.loadingImages.delete(fullUrl);
      console.error(`✗ Failed to load image: ${path}`, error);
      
      // Return fallback image or throw based on configuration
      return this.createFallbackImage();
    }
  }

  // Audio Loading
  async getAudio(path: string): Promise<HTMLAudioElement> {
    const fullUrl = this.resolveUrl(path);
    
    // Check cache first
    if (this.audioCache.has(fullUrl)) {
      this.incrementRefCount(fullUrl);
      this.updateLastAccessed(fullUrl);
      
      // Clone audio element for multiple simultaneous playback
      const cachedAudio = this.audioCache.get(fullUrl)!;
      return cachedAudio.cloneNode(true) as HTMLAudioElement;
    }

    // Check if already loading
    if (this.loadingAudio.has(fullUrl)) {
      const audio = await this.loadingAudio.get(fullUrl)!.promise;
      return audio.cloneNode(true) as HTMLAudioElement;
    }

    // Start loading
    const loadingPromise = this.createAudioLoadingPromise(fullUrl);
    this.loadingAudio.set(fullUrl, loadingPromise);

    try {
      const audio = await loadingPromise.promise;
      
      // Cache successful load
      this.audioCache.set(fullUrl, audio);
      this.recordMetadata(fullUrl, AssetType.AUDIO, this.estimateAudioSize(audio));
      
      this.loadingAudio.delete(fullUrl);
      
      if (this.enableLogging) {
        console.log(`✓ Loaded audio: ${path}`);
      }
      
      // Return clone for use
      return audio.cloneNode(true) as HTMLAudioElement;
    } catch (error) {
      this.loadingAudio.delete(fullUrl);
      console.error(`✗ Failed to load audio: ${path}`, error);
      
      // Return silent fallback audio
      return this.createFallbackAudio();
    }
  }

  // Batch Loading
  async preloadAssets(assets: { images?: string[]; audio?: string[]; json?: string[] }): Promise<void> {
    const loadPromises: Promise<any>[] = [];

    // Load all images
    if (assets.images) {
      loadPromises.push(...assets.images.map(path => this.getImage(path)));
    }

    // Load all audio
    if (assets.audio) {
      loadPromises.push(...assets.audio.map(path => this.getAudio(path)));
    }

    // Load all JSON
    if (assets.json) {
      loadPromises.push(...assets.json.map(path => this.getJson(path)));
    }

    // Wait for all assets to load (or fail)
    const results = await Promise.allSettled(loadPromises);
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (this.enableLogging) {
      console.log(`Preload complete: ${successful} successful, ${failed} failed`);
    }

    // Don't throw on failed preloads - individual asset requests will handle errors
  }

  // JSON and Text Loading
  async getJson<T = any>(path: string): Promise<T> {
    const fullUrl = this.resolveUrl(path);
    
    if (this.jsonCache.has(fullUrl)) {
      this.incrementRefCount(fullUrl);
      this.updateLastAccessed(fullUrl);
      return this.jsonCache.get(fullUrl);
    }

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.jsonCache.set(fullUrl, data);
      this.recordMetadata(fullUrl, AssetType.JSON, JSON.stringify(data).length);
      
      return data;
    } catch (error) {
      console.error(`✗ Failed to load JSON: ${path}`, error);
      throw error; // JSON failures should be handled by caller
    }
  }

  async getText(path: string): Promise<string> {
    const fullUrl = this.resolveUrl(path);
    
    if (this.textCache.has(fullUrl)) {
      this.incrementRefCount(fullUrl);
      this.updateLastAccessed(fullUrl);
      return this.textCache.get(fullUrl)!;
    }

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      this.textCache.set(fullUrl, text);
      this.recordMetadata(fullUrl, AssetType.TEXT, text.length);
      
      return text;
    } catch (error) {
      console.error(`✗ Failed to load text: ${path}`, error);
      throw error;
    }
  }

  // Reference Counting and Cleanup
  releaseAsset(path: string): void {
    const fullUrl = this.resolveUrl(path);
    const meta = this.metadata.get(fullUrl);
    
    if (meta) {
      meta.refCount = Math.max(0, meta.refCount - 1);
      
      // Consider cleanup if no references
      if (meta.refCount === 0) {
        // Don't immediately remove - keep for potential reuse
        // Actual cleanup happens during memory pressure or explicit cleanup
      }
    }
  }

  // Memory Management
  cleanup(options: {
    maxAge?: number; // Remove assets older than this (ms)
    forceAll?: boolean; // Remove all unreferenced assets
    targetSize?: number; // Clean until cache is under this size
  } = {}): void {
    const now = Date.now();
    const maxAge = options.maxAge || 5 * 60 * 1000; // 5 minutes default
    
    this.metadata.forEach((meta, url) => {
      const shouldRemove = options.forceAll || 
                          (meta.refCount === 0 && (now - meta.lastAccessed) > maxAge);
      
      if (shouldRemove) {
        this.removeAssetFromCache(url, meta.type);
      }
    });

    // If target size specified, remove oldest assets until under limit
    if (options.targetSize) {
      this.cleanupToSize(options.targetSize);
    }

    if (this.enableLogging) {
      console.log(`Cleanup complete. Cache size: ${this.getCacheSize()} bytes`);
    }
  }

  getCacheStats(): {
    images: number;
    audio: number;
    json: number;
    text: number;
    totalSize: number;
    totalAssets: number;
  } {
    return {
      images: this.imageCache.size,
      audio: this.audioCache.size,
      json: this.jsonCache.size,
      text: this.textCache.size,
      totalSize: this.getCacheSize(),
      totalAssets: this.metadata.size
    };
  }

  // Private Implementation Details

  private createImageLoadingPromise(url: string): LoadingPromise<HTMLImageElement> {
    let resolve: (image: HTMLImageElement) => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<HTMLImageElement>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const image = new Image();
    image.crossOrigin = 'anonymous'; // Enable CORS for canvas usage
    
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    
    image.src = url;

    return {
      promise,
      resolvers: [resolve],
      rejectors: [reject]
    };
  }

  private createAudioLoadingPromise(url: string): LoadingPromise<HTMLAudioElement> {
    let resolve: (audio: HTMLAudioElement) => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<HTMLAudioElement>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const audio = new Audio();
    
    const onCanPlayThrough = () => {
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
      audio.removeEventListener('error', onError);
      resolve(audio);
    };
    
    const onError = () => {
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
      audio.removeEventListener('error', onError);
      reject(new Error(`Failed to load audio: ${url}`));
    };
    
    audio.addEventListener('canplaythrough', onCanPlayThrough);
    audio.addEventListener('error', onError);
    
    audio.src = url;

    return {
      promise,
      resolvers: [resolve],
      rejectors: [reject]
    };
  }

  private resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
      return path;
    }
    return `${this.baseUrl}/${path}`.replace(/\/+/g, '/');
  }

  private recordMetadata(url: string, type: AssetType, size: number): void {
    this.metadata.set(url, {
      url,
      type,
      size,
      lastAccessed: Date.now(),
      refCount: 1,
      loadedAt: Date.now()
    });
  }

  private incrementRefCount(url: string): void {
    const meta = this.metadata.get(url);
    if (meta) {
      meta.refCount++;
    }
  }

  private updateLastAccessed(url: string): void {
    const meta = this.metadata.get(url);
    if (meta) {
      meta.lastAccessed = Date.now();
    }
  }

  private estimateImageSize(image: HTMLImageElement): number {
    // Rough estimate: width * height * 4 bytes per pixel
    return image.width * image.height * 4;
  }

  private estimateAudioSize(audio: HTMLAudioElement): number {
    // Rough estimate based on duration (if available)
    if (audio.duration && isFinite(audio.duration)) {
      return audio.duration * 44100 * 2 * 2; // 44.1kHz, 16-bit, stereo
    }
    return 1024 * 1024; // 1MB default estimate
  }

  private createFallbackImage(): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('?', 16, 20);
    
    const image = new Image();
    image.src = canvas.toDataURL();
    return image;
  }

  private createFallbackAudio(): HTMLAudioElement {
    const audio = new Audio();
    // Create silent audio data URL
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    return audio;
  }

  private removeAssetFromCache(url: string, type: AssetType): void {
    switch (type) {
      case AssetType.IMAGE:
        this.imageCache.delete(url);
        break;
      case AssetType.AUDIO:
        this.audioCache.delete(url);
        break;
      case AssetType.JSON:
        this.jsonCache.delete(url);
        break;
      case AssetType.TEXT:
        this.textCache.delete(url);
        break;
    }
    this.metadata.delete(url);
  }

  private getCacheSize(): number {
    let totalSize = 0;
    this.metadata.forEach(meta => {
      totalSize += meta.size || 0;
    });
    return totalSize;
  }

  private cleanupToSize(targetSize: number): void {
    const currentSize = this.getCacheSize();
    if (currentSize <= targetSize) return;

    // Sort by last accessed (oldest first) and ref count (unreferenced first)
    const sortedAssets = Array.from(this.metadata.entries())
      .sort(([, a], [, b]) => {
        if (a.refCount !== b.refCount) {
          return a.refCount - b.refCount; // Unreferenced first
        }
        return a.lastAccessed - b.lastAccessed; // Oldest first
      });

    let removedSize = 0;
    for (const [url, meta] of sortedAssets) {
      if (currentSize - removedSize <= targetSize) break;
      
      this.removeAssetFromCache(url, meta.type);
      removedSize += meta.size || 0;
    }
  }
}
```

## Integration with Entity System

### Entity Asset Loading
```typescript
class ImageEntity extends RenderableEntity {
  private image: HTMLImageElement | null = null;
  private imagePath: string;

  constructor(imagePath: string, name: string = 'image') {
    super(name);
    this.imagePath = imagePath;
  }

  async onInitialize(): Promise<void> {
    try {
      this.image = await AssetManager.getInstance().getImage(this.imagePath);
      
      // Set entity dimensions based on image
      this.width = this.image.width;
      this.height = this.image.height;
      
    } catch (error) {
      console.error(`Failed to load image for entity ${this.name}:`, error);
      // Entity can still exist without image - will render as fallback
    }
  }

  renderSelf(ctx: CanvasRenderingContext2D): void {
    if (!this.image) return;

    ctx.globalAlpha = this.worldOpacity;
    
    const offsetX = -this.width * this.anchorX;
    const offsetY = -this.height * this.anchorY;
    
    ctx.drawImage(this.image, offsetX, offsetY, this.width, this.height);
  }

  dispose(): void {
    // Release asset reference
    if (this.imagePath) {
      AssetManager.getInstance().releaseAsset(this.imagePath);
    }
    
    this.image = null;
    super.dispose();
  }

  clone(): ImageEntity {
    const cloned = new ImageEntity(this.imagePath, this.name);
    // Image will be loaded during cloned entity's initialization
    return cloned;
  }
}

class AudioEntity extends Entity {
  private audio: HTMLAudioElement | null = null;
  private audioPath: string;
  private config: AudioConfig;

  constructor(audioPath: string, config: AudioConfig = {}) {
    super('audio');
    this.audioPath = audioPath;
    this.config = { volume: 1.0, loop: false, autoPlay: false, ...config };
  }

  async onInitialize(): Promise<void> {
    try {
      this.audio = await AssetManager.getInstance().getAudio(this.audioPath);
      
      this.audio.volume = this.config.volume;
      this.audio.loop = this.config.loop;
      
      if (this.config.autoPlay) {
        this.playAudio();
      }
    } catch (error) {
      console.error(`Failed to load audio for entity ${this.name}:`, error);
      // Entity continues without audio
    }
  }

  playAudio(): void {
    if (this.audio) {
      this.audio.play().catch(e => 
        console.warn(`Audio play failed: ${this.audioPath}`, e)
      );
    }
  }

  dispose(): void {
    // Release asset reference
    if (this.audioPath) {
      AssetManager.getInstance().releaseAsset(this.audioPath);
    }
    
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    
    super.dispose();
  }
}
```

### Scene-Level Asset Management
```typescript
abstract class Scene {
  protected assetManager = AssetManager.getInstance();
  
  // Preload assets before scene starts
  async preloadAssets(): Promise<void> {
    const requiredAssets = this.getRequiredAssets();
    await this.assetManager.preloadAssets(requiredAssets);
  }

  // Override in subclasses to specify required assets
  protected getRequiredAssets(): { images?: string[]; audio?: string[]; json?: string[] } {
    return {};
  }

  // Cleanup scene assets when scene finishes
  destroy(): void {
    // Release all assets used by this scene
    const requiredAssets = this.getRequiredAssets();
    
    requiredAssets.images?.forEach(path => this.assetManager.releaseAsset(path));
    requiredAssets.audio?.forEach(path => this.assetManager.releaseAsset(path));
    requiredAssets.json?.forEach(path => this.assetManager.releaseAsset(path));
    
    super.destroy();
  }
}

class XJasonScene extends Scene {
  protected getRequiredAssets() {
    return {
      images: ['xJason.svg'],
      audio: ['heavyrain-jason.mp3']
    };
  }

  async initialize(): Promise<void> {
    // Preload all scene assets
    await this.preloadAssets();
    
    // Scene is ready to start
  }
}
```

## Development and Production Considerations

### Development Mode Features
```typescript
class AssetManager {
  private developmentMode: boolean = false;

  enableDevelopmentMode(): void {
    this.developmentMode = true;
    this.enableLogging = true;
    
    // Add development-specific features
    this.setupHotReload();
    this.setupAssetValidation();
  }

  private setupHotReload(): void {
    if (!this.developmentMode) return;
    
    // Watch for asset changes and reload automatically
    // Implementation would depend on development server setup
  }

  private setupAssetValidation(): void {
    if (!this.developmentMode) return;
    
    // Validate asset formats, sizes, and other properties
    // Warn about potential issues
  }

  // Development utility: List all loaded assets
  getLoadedAssets(): { path: string; type: AssetType; size: number; refCount: number }[] {
    return Array.from(this.metadata.entries()).map(([url, meta]) => ({
      path: url,
      type: meta.type,
      size: meta.size || 0,
      refCount: meta.refCount
    }));
  }

  // Development utility: Force reload an asset
  async reloadAsset(path: string): Promise<void> {
    const fullUrl = this.resolveUrl(path);
    
    // Remove from cache
    const meta = this.metadata.get(fullUrl);
    if (meta) {
      this.removeAssetFromCache(fullUrl, meta.type);
    }
    
    // Reload based on type
    if (this.imageCache.has(fullUrl)) {
      await this.getImage(path);
    } else if (this.audioCache.has(fullUrl)) {
      await this.getAudio(path);
    }
  }
}
```

### Production Optimizations
```typescript
class AssetManager {
  // Production setup
  setupProduction(options: {
    cdnBaseUrl?: string;
    enableCompression?: boolean;
    enableServiceWorker?: boolean;
  }): void {
    if (options.cdnBaseUrl) {
      this.baseUrl = options.cdnBaseUrl;
    }
    
    if (options.enableServiceWorker) {
      this.setupServiceWorkerCaching();
    }
    
    // Optimize cache settings for production
    this.maxCacheSize = 200 * 1024 * 1024; // 200MB for production
    this.enableLogging = false;
  }

  private setupServiceWorkerCaching(): void {
    // Register service worker for offline asset caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/asset-cache-sw.js');
    }
  }

  // Optimize assets for production
  optimizeForProduction(): void {
    // Set up aggressive caching policies
    // Implement asset versioning
    // Enable compression
  }
}
```

## Error Handling and Fallbacks

### Graceful Degradation
```typescript
interface AssetFallbacks {
  images: Map<string, string>; // path -> fallback path
  audio: Map<string, string>;
  defaultImage?: string;
  defaultAudio?: string;
}

class AssetManager {
  private fallbacks: AssetFallbacks = {
    images: new Map(),
    audio: new Map()
  };

  configureFallbacks(fallbacks: Partial<AssetFallbacks>): void {
    if (fallbacks.images) {
      this.fallbacks.images = new Map(fallbacks.images);
    }
    if (fallbacks.audio) {
      this.fallbacks.audio = new Map(fallbacks.audio);
    }
    if (fallbacks.defaultImage) {
      this.fallbacks.defaultImage = fallbacks.defaultImage;
    }
    if (fallbacks.defaultAudio) {
      this.fallbacks.defaultAudio = fallbacks.defaultAudio;
    }
  }

  private async tryFallbackImage(originalPath: string): Promise<HTMLImageElement> {
    // Try specific fallback first
    const fallbackPath = this.fallbacks.images.get(originalPath);
    if (fallbackPath) {
      try {
        return await this.getImage(fallbackPath);
      } catch {
        // Fallback also failed, continue to default
      }
    }

    // Try default fallback
    if (this.fallbacks.defaultImage) {
      try {
        return await this.getImage(this.fallbacks.defaultImage);
      } catch {
        // Default fallback failed, use generated fallback
      }
    }

    // Use generated fallback
    return this.createFallbackImage();
  }
}
```

## Testing and Validation

### Asset Validation
```typescript
class AssetValidator {
  static validateImage(image: HTMLImageElement): boolean {
    return image.width > 0 && image.height > 0 && image.complete;
  }

  static validateAudio(audio: HTMLAudioElement): boolean {
    return !audio.error && audio.readyState >= 2; // HAVE_CURRENT_DATA
  }

  static validateImageFormat(path: string): boolean {
    const supportedFormats = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    return supportedFormats.some(format => path.toLowerCase().endsWith(format));
  }

  static validateAudioFormat(path: string): boolean {
    const supportedFormats = ['.mp3', '.ogg', '.wav', '.m4a'];
    return supportedFormats.some(format => path.toLowerCase().endsWith(format));
  }
}
```

This AssetManager design provides robust resource management with proper caching, error handling, and integration points for the entity system while maintaining good performance and development experience.