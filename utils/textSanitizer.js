// utils/textSanitizer.js

/**
 * Sanitize text input to prevent potential exploits and ensure clean display
 * @param {string|any} text - The text to sanitize
 * @returns {string} - The sanitized text
 */
export function sanitizeText(text) {
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