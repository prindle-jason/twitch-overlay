import { Entity } from '@/entities/Entity';
import { TransformEntity } from '@/entities/TransformEntity';

/**
 * World transform data for entities
 */
export interface WorldTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

/**
 * Bounding box in world coordinates
 */
export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/**
 * TransformSystem - Provides lazy world coordinate calculation for collision detection
 * 
 * Minimal MVP implementation focusing on on-demand world transform computation.
 * Unlike rendering which uses Canvas transforms, collision detection requires explicit world coordinates.
 */
export class TransformSystem {
  private worldTransforms = new Map<string, WorldTransform>();
  private dirtyEntities = new Set<string>();

  /**
   * Get world transform for an entity, computing it lazily if needed
   */
  getWorldTransform(entity: TransformEntity): WorldTransform {
    if (this.dirtyEntities.has(entity.id) || !this.worldTransforms.has(entity.id)) {
      this.computeWorldTransform(entity);
      this.dirtyEntities.delete(entity.id);
    }
    
    return this.worldTransforms.get(entity.id)!;
  }

  /**
   * Get world space bounding box for an entity
   */
  getWorldBounds(entity: TransformEntity): BoundingBox {
    const worldTransform = this.getWorldTransform(entity);
    
    // Calculate bounds with anchor point and scaling
    const scaledWidth = entity.width * Math.abs(worldTransform.scaleX);
    const scaledHeight = entity.height * Math.abs(worldTransform.scaleY);
    
    const left = worldTransform.x - (scaledWidth * entity.anchorX);
    const top = worldTransform.y - (scaledHeight * entity.anchorY);
    const right = left + scaledWidth;
    const bottom = top + scaledHeight;
    
    return {
      left,
      top,
      right,
      bottom,
      width: scaledWidth,
      height: scaledHeight
    };
  }

  /**
   * Check if a world point is inside an entity
   */
  pointInEntity(entity: TransformEntity, worldX: number, worldY: number): boolean {
    const bounds = this.getWorldBounds(entity);
    
    return worldX >= bounds.left && 
           worldX <= bounds.right && 
           worldY >= bounds.top && 
           worldY <= bounds.bottom;
  }

  /**
   * Mark an entity as needing transform recalculation
   */
  markDirty(entity: TransformEntity): void {
    this.dirtyEntities.add(entity.id);
    
    // Mark all descendants as dirty
    this.markChildrenDirty(entity);
  }

  /**
   * Compute world transform for an entity by combining with parent transforms
   */
  private computeWorldTransform(entity: TransformEntity): void {
    const parentChain = this.buildParentChain(entity);
    
    // Start with identity transform
    let currentTransform: WorldTransform = {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    };
    
    // Apply each parent's transform from root down
    for (const parent of parentChain) {
      if (this.dirtyEntities.has(parent.id) || !this.worldTransforms.has(parent.id)) {
        const parentTransform = this.combineTransforms(currentTransform, parent);
        this.worldTransforms.set(parent.id, parentTransform);
        this.dirtyEntities.delete(parent.id);
      }
      currentTransform = this.worldTransforms.get(parent.id)!;
    }
    
    // Finally compute entity's world transform
    const entityTransform = this.combineTransforms(currentTransform, entity);
    this.worldTransforms.set(entity.id, entityTransform);
  }

  /**
   * Build parent chain from root to entity
   */
  private buildParentChain(entity: TransformEntity): TransformEntity[] {
    const chain: TransformEntity[] = [];
    let current = this.findParent(entity);
    
    while (current instanceof TransformEntity) {
      chain.unshift(current); // Add to front
      current = this.findParent(current);
    }
    
    return chain;
  }

  /**
   * Find the parent of an entity (simplified - assumes parent tracking exists)
   */
  private findParent(entity: Entity): Entity | null {
    // Note: This is a simplified implementation
    // In practice, entities would need to track their parent
    // or we'd need to search through all entities
    return null;
  }

  /**
   * Combine parent world transform with entity's local transform
   */
  private combineTransforms(parentWorld: WorldTransform, entity: TransformEntity): WorldTransform {
    // Convert rotation to radians for math
    const parentRotRad = (parentWorld.rotation * Math.PI) / 180;
    const cos = Math.cos(parentRotRad);
    const sin = Math.sin(parentRotRad);
    
    // Scale local position by parent scale
    const scaledLocalX = entity.x * parentWorld.scaleX;
    const scaledLocalY = entity.y * parentWorld.scaleY;
    
    // Rotate scaled local position by parent rotation
    const rotatedX = scaledLocalX * cos - scaledLocalY * sin;
    const rotatedY = scaledLocalX * sin + scaledLocalY * cos;
    
    return {
      x: parentWorld.x + rotatedX,
      y: parentWorld.y + rotatedY,
      scaleX: parentWorld.scaleX * entity.scaleX,
      scaleY: parentWorld.scaleY * entity.scaleY,
      rotation: parentWorld.rotation + entity.rotation
    };
  }

  /**
   * Mark all descendants as dirty
   */
  private markChildrenDirty(entity: Entity): void {
    entity.children.forEach(child => {
      if (child instanceof TransformEntity) {
        this.dirtyEntities.add(child.id);
        this.markChildrenDirty(child);
      }
    });
  }

  /**
   * Clear all cached transforms (useful for testing or major scene changes)
   */
  clearCache(): void {
    this.worldTransforms.clear();
    this.dirtyEntities.clear();
  }
}