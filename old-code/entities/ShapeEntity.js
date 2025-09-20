import TransformEntity from './TransformEntity.js';

/**
 * Entity that draws geometric shapes.
 * Basic building block for procedural graphics.
 */
class ShapeEntity extends TransformEntity {
  constructor(shapeType, config = {}) {
    super(config);
    
    this.shapeType = shapeType;
    this.fillColor = config.fillColor || '#ffffff';
    this.strokeColor = config.strokeColor || null;
    this.strokeWidth = config.strokeWidth || 1;
    
    // Shape-specific properties
    this.radius = config.radius || 0;
    this.cornerRadius = config.cornerRadius || 0;
    
    // Set default size if not provided
    if (this.width === 0) {
      this.width = config.radius ? config.radius * 2 : 50;
    }
    if (this.height === 0) {
      this.height = config.radius ? config.radius * 2 : 50;
    }
  }
  
  /**
   * Draw the shape
   * @param {CanvasRenderingContext2D} ctx - Canvas context (already transformed)
   */
  drawSelf(ctx) {
    // Calculate draw position based on anchor
    const drawX = -this.width * this.anchorX;
    const drawY = -this.height * this.anchorY;
    
    ctx.save();
    
    // Set fill and stroke styles
    if (this.fillColor) {
      ctx.fillStyle = this.fillColor;
    }
    if (this.strokeColor) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
    }
    
    ctx.beginPath();
    
    // Draw based on shape type
    switch (this.shapeType) {
      case 'rectangle':
        this.drawRectangle(ctx, drawX, drawY);
        break;
      case 'circle':
        this.drawCircle(ctx, drawX, drawY);
        break;
      case 'ellipse':
        this.drawEllipse(ctx, drawX, drawY);
        break;
      default:
        console.warn(`Unknown shape type: ${this.shapeType}`);
        break;
    }
    
    // Fill and stroke
    if (this.fillColor) {
      ctx.fill();
    }
    if (this.strokeColor) {
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  /**
   * Draw a rectangle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawRectangle(ctx, x, y) {
    if (this.cornerRadius > 0) {
      // Rounded rectangle
      const radius = Math.min(this.cornerRadius, this.width / 2, this.height / 2);
      
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + this.width - radius, y);
      ctx.quadraticCurveTo(x + this.width, y, x + this.width, y + radius);
      ctx.lineTo(x + this.width, y + this.height - radius);
      ctx.quadraticCurveTo(x + this.width, y + this.height, x + this.width - radius, y + this.height);
      ctx.lineTo(x + radius, y + this.height);
      ctx.quadraticCurveTo(x, y + this.height, x, y + this.height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
    } else {
      // Regular rectangle
      ctx.rect(x, y, this.width, this.height);
    }
  }
  
  /**
   * Draw a circle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawCircle(ctx, x, y) {
    const centerX = x + this.width / 2;
    const centerY = y + this.height / 2;
    const radius = this.radius || Math.min(this.width, this.height) / 2;
    
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  }
  
  /**
   * Draw an ellipse
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  drawEllipse(ctx, x, y) {
    const centerX = x + this.width / 2;
    const centerY = y + this.height / 2;
    const radiusX = this.width / 2;
    const radiusY = this.height / 2;
    
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  }
  
  /**
   * Set the fill color
   * @param {string} color - CSS color string
   */
  setFillColor(color) {
    this.fillColor = color;
  }
  
  /**
   * Set the stroke color and width
   * @param {string} color - CSS color string
   * @param {number} width - Stroke width
   */
  setStroke(color, width = 1) {
    this.strokeColor = color;
    this.strokeWidth = width;
  }
  
  /**
   * Set the corner radius for rectangles
   * @param {number} radius - Corner radius
   */
  setCornerRadius(radius) {
    this.cornerRadius = radius;
  }
}

export default ShapeEntity;