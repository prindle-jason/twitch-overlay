export function sanitizeText(text: unknown): string {
  let str = typeof text === "string" ? text : String(text);

  str = str.replace(/<[^>]*>/g, "");
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");

  const maxLength = 500;
  if (str.length > maxLength) {
    str = str.substring(0, maxLength) + "...";
  }

  str = str.replace(/[\u200B-\u200D\uFEFF]/g, "");

  return str.trim();
}
