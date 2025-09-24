// elements/RichTextElement.js
import { BaseElement } from './BaseElement.js';
import { sanitizeText } from '../utils/textSanitizer.js';

export class RichTextElement extends BaseElement {
  constructor(text, emoteData, config = {}) {
    super(config);
    
    // Text properties
    this.text = sanitizeText(text || '');
    this.emoteData = emoteData || [];
    this.font = config.font || 'Arial';
    this.fontSize = config.fontSize || 24;
    this.color = config.color || '#ffffff';
    this.fontWeight = config.fontWeight || 'normal';
    this.textAlign = config.textAlign || 'center';
    this.textBaseline = config.textBaseline || 'middle';
    
    // Emote properties
    this.emoteHeight = config.emoteHeight || this.fontSize;
    this.emotePadding = config.emotePadding || 2;
    
    // Position properties
    this.x = config.x || 0;
    this.y = config.y || 0;
    
    // Visual properties
    this.visible = config.visible !== undefined ? config.visible : true;
    this.opacity = config.opacity !== undefined ? config.opacity : 1;
    
    // Parse text with emotes into segments
    this.segments = this.parseTextWithEmotes();
    
    // Calculate dimensions once
    this.width = this.calculateWidth();
    this.height = Math.max(this.fontSize, this.emoteHeight);
  }
  
  /**
   * Parse text with emotes into simple segments
   */
  parseTextWithEmotes() {
    // If no emotes, return single text segment
    if (!this.emoteData || this.emoteData.length === 0) {
      return [{ type: 'text', content: this.text, width: 0 }];
    }
    
    // Sort emotes by start position
    const sortedEmotes = [...this.emoteData].sort((a, b) => a.start - b.start);
    
    const segments = [];
    let currentPos = 0;
    
    for (const emote of sortedEmotes) {
      // Add text before this emote
      if (currentPos < emote.start) {
        const textContent = this.text.substring(currentPos, emote.start);
        if (textContent) {
          segments.push({ type: 'text', content: textContent, width: 0 });
        }
      }
      
      // Add emote segment with immediate image loading
      const emoteImage = new Image();
      emoteImage.crossOrigin = 'anonymous';
      emoteImage.src = emote.url;
      
      segments.push({
        type: 'emote',
        content: emote.name,
        width: this.emoteHeight,
        image: emoteImage
      });
      
      currentPos = emote.end + 1;
    }
    
    // Add remaining text
    if (currentPos < this.text.length) {
      const textContent = this.text.substring(currentPos);
      if (textContent) {
        segments.push({ type: 'text', content: textContent, width: 0 });
      }
    }
    
    return segments;
  }
  
  /**
   * Calculate the total width of all segments (done once)
   */
  calculateWidth() {
    const ctx = this.createTempContext();
    
    ctx.save();
    ctx.font = this.getFontString();
    
    let totalWidth = 0;
    
    for (const segment of this.segments) {
      if (segment.type === 'text') {
        segment.width = ctx.measureText(segment.content).width;
        totalWidth += segment.width;
      } else if (segment.type === 'emote') {
        // Emote width is emoteHeight + padding
        totalWidth += this.emoteHeight + (this.emotePadding * 2);
      }
    }
    
    ctx.restore();
    return totalWidth;
  }
  
  /**
   * Get the font string for canvas
   */
  getFontString() {
    return `${this.fontWeight} ${this.fontSize}px ${this.font}`;
  }
  
  /**
   * Get the width of the text when rendered (cached)
   */
  getTextWidth(ctx = null) {
    return this.width;
  }
  
  /**
   * Get the height of the text (including emotes)
   */
  getTextHeight() {
    return this.height; // Already calculated as Math.max(fontSize, emoteHeight)
  }
  
  /**
   * Create a temporary canvas context for measurements
   */
  createTempContext() {
    const canvas = document.createElement('canvas');
    return canvas.getContext('2d');
  }
  
  /**
   * Draw the text (and emotes) to the canvas
   */
  draw(ctx) {
    if (!this.visible || this.opacity <= 0) return;
    
    ctx.save();
    
    // Apply opacity
    ctx.globalAlpha = this.opacity;
    
    // Set font properties
    ctx.font = this.getFontString();
    ctx.fillStyle = this.color;
    ctx.textBaseline = this.textBaseline;
    
    // Calculate starting position based on text alignment
    let startX = this.x;
    if (this.textAlign === 'center') {
      startX = this.x - (this.getTextWidth(ctx) / 2);
    } else if (this.textAlign === 'right') {
      startX = this.x - this.getTextWidth(ctx);
    }
    
    let currentX = startX;
    
    // Draw each segment
    for (const segment of this.segments) {
      if (segment.type === 'text') {
        ctx.fillText(segment.content, currentX, this.y);
        currentX += segment.width;
      } else if (segment.type === 'emote') {
        currentX += this.emotePadding;
        
        // Check if emote image is loaded
        if (segment.image.complete && segment.image.naturalWidth > 0) {
          // Draw emote image
          const emoteY = this.textBaseline === 'middle' 
            ? this.y - (this.emoteHeight / 2)
            : this.y;
          
          ctx.drawImage(segment.image, currentX, emoteY, this.emoteHeight, this.emoteHeight);
        } else {
          // Fallback: draw emote name as text
          ctx.save();
          ctx.fillStyle = '#ff69b4'; // Pink for emotes
          ctx.fillText(segment.content, currentX, this.y);
          ctx.restore();
        }
        
        currentX += this.emoteHeight + this.emotePadding;
      }
    }
    
    ctx.restore();
  }
}