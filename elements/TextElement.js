// elements/TextElement.js
import { BaseElement } from './BaseElement.js';

export class TextElement extends BaseElement {
  constructor(text, config = {}) {
    super(config);
    
    // Text properties
    this.text = this.sanitizeText(text || '');
    this.font = config.font || 'Arial';
    this.fontSize = config.fontSize || 24;
    this.color = config.color || '#ffffff';
    this.fontWeight = config.fontWeight || 'normal';
    this.textAlign = config.textAlign || 'left';
    this.textBaseline = config.textBaseline || 'top';
    
    // Position properties
    this.x = config.x || 0;
    this.y = config.y || 0;
    
    // Visual properties
    this.opacity = config.opacity !== undefined ? config.opacity : 1;
    
    // Stroke properties for text outline
    this.strokeColor = config.strokeColor || null;
    this.strokeWidth = config.strokeWidth || 0;
    
    // Cache the computed font string
    this._computedFont = null;
    this._lastFontConfig = null;
  }
  
  /**
   * Sanitize text input to prevent potential exploits
   * @param {string} text - Raw text input
   * @returns {string} - Sanitized text
   */
  sanitizeText(text) {
    if (typeof text !== 'string') {
      text = String(text);
    }
    
    // Remove any potential script tags or dangerous content
    text = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
    
    // Remove control characters except newlines, tabs, and carriage returns
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    
    // Limit length to prevent extremely long messages
    const maxLength = 500;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }
    
    // Replace potentially problematic Unicode characters
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters
    
    return text.trim();
  }
  
  /**
   * Get the computed font string for canvas
   */
  getComputedFont() {
    const currentConfig = `${this.fontWeight} ${this.fontSize}px ${this.font}`;
    
    // Cache the font string to avoid repeated string concatenation
    if (this._lastFontConfig !== currentConfig) {
      this._computedFont = currentConfig;
      this._lastFontConfig = currentConfig;
    }
    
    return this._computedFont;
  }
  
  /**
   * Get the width of the text when rendered
   * @param {CanvasRenderingContext2D} ctx - Canvas context for measurement
   * @returns {number} - Text width in pixels
   */
  getTextWidth(ctx) {
    if (!this.text) return 0;
    
    ctx.save();
    ctx.font = this.getComputedFont();
    const width = ctx.measureText(this.text).width;
    ctx.restore();
    
    return width;
  }
  
  /**
   * Get the height of the text (approximate)
   * @returns {number} - Text height in pixels
   */
  getTextHeight() {
    // For most fonts, the height is approximately the font size
    // This is an approximation - for more accuracy, you'd use TextMetrics
    return this.fontSize;
  }
  
  /**
   * Update the text content (with sanitization)
   * @param {string} newText - New text content
   */
  setText(newText) {
    this.text = this.sanitizeText(newText);
  }
  
  /**
   * Draw the text to the canvas
   * @param {CanvasRenderingContext2D} ctx 
   */
  draw(ctx) {
    if (!this.text || this.opacity <= 0) return;
    
    ctx.save();
    
    // Apply opacity
    ctx.globalAlpha = this.opacity;
    
    // Set font properties
    ctx.font = this.getComputedFont();
    ctx.fillStyle = this.color;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;
    
    // Draw stroke (outline) if specified
    if (this.strokeColor && this.strokeWidth > 0) {
      ctx.strokeStyle = this.strokeColor;
      ctx.lineWidth = this.strokeWidth;
      ctx.strokeText(this.text, this.x, this.y);
    }
    
    // Draw the text
    ctx.fillText(this.text, this.x, this.y);
    
    ctx.restore();
  }
}