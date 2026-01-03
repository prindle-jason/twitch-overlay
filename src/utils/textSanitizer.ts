export function sanitizeText(text: string): string {
  text = text.replace(/<[^>]*>/g, "");
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");

  const maxLength = 500;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + "...";
  }

  text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");

  return text.trim();
}
