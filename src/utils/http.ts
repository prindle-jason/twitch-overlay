import { logger } from "./logger";

// Whitelist of extensions we trust when parsing URLs
const VALID_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

/**
 * Extract the file extension from a URL or file path
 * Returns the extension in lowercase without the dot
 * @param url The URL or file path
 * @returns The file extension (e.g., "png", "gif"), or empty string if none
 */
export function getExtension(url: string): string | null {
  try {
    const u = new URL(url, "http://localhost");
    const pathname = u.pathname;

    // Only consider the last path segment as a filename
    const last = pathname.split("/").pop() || "";
    const dotIdx = last.lastIndexOf(".");
    if (dotIdx <= 0) {
      // No dot or dot at start → not a trusted extension
      return null;
    }

    const candidate = last.slice(dotIdx + 1).toLowerCase();
    if (VALID_EXTENSIONS.has(candidate)) {
      return candidate;
    }

    // Some CDNs provide format via query params
    const qFormat = (
      u.searchParams.get("format") ||
      u.searchParams.get("ext") ||
      ""
    ).toLowerCase();
    return VALID_EXTENSIONS.has(qFormat) ? qFormat : null;
  } catch (err) {
    return null;
  }
}

/**
 * Check if a URL is external (starts with http:// or https://)
 */
export function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Get the proxy URL for an external URL to avoid CORS issues
 */
export function getProxyUrl(url: string): string {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

/**
 * Resolve a URL to its loadable form, applying proxy for external URLs
 * @param url The URL to resolve
 * @returns The URL to use for loading (may be proxied if external)
 */
export function resolveUrl(url: string): string {
  return isExternalUrl(url) ? getProxyUrl(url) : url;
}

/**
 * Map file extension to MIME type (content-type)
 * @param ext The file extension (without dot), e.g., "png", "gif"
 * @returns The MIME type, e.g., "image/png"
 */
export function extensionToContentType(ext: string): string {
  switch (ext) {
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/png"; // Default fallback
  }
}

/**
 * Get the content type for a URL, checking extension first, then HTTP header
 * Returns the MIME type without parameters, normalized to lowercase
 * @param url The URL to detect content type for
 * @returns The content type, e.g., "image/gif"
 */
export async function getContentType(url: string): Promise<string> {
  const ext = getExtension(url);
  const contentType = ext
    ? extensionToContentType(ext)
    : await fetchHeader(url, "content-type");

  logger.debug("[http] detected content type", { url, ext, contentType });
  // Parse content-type and remove parameters
  return contentType.split(";")[0].trim().toLowerCase();
}

/**
 * Fetch a specific HTTP header from a URL
 * Uses proxy for external URLs to avoid CORS
 * @param url The URL to fetch the header from
 * @param headerName The name of the header to retrieve
 * @returns The header value, or empty string if not found
 */
export async function fetchHeader(
  url: string,
  headerName: string
): Promise<string> {
  try {
    const fetchUrl = isExternalUrl(url) ? getProxyUrl(url) : url;

    const response = await fetch(fetchUrl, { method: "HEAD" });
    if (!response.ok) {
      logger.warn("[http] HEAD request failed", {
        url,
        status: response.status,
      });
      return "";
    }
    return response.headers.get(headerName) || "";
  } catch (err) {
    logger.warn("[http] Failed to fetch header", {
      url,
      headerName,
      err,
    });
    return "";
  }
}

/**
 * Fetch an ArrayBuffer from a URL
 * Uses proxy for external URLs to avoid CORS
 * @param url The URL to fetch the buffer from
 * @returns The buffer data
 */
export async function fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
  const fetchUrl = isExternalUrl(url) ? getProxyUrl(url) : url;

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch buffer: ${url} (${response.status})`);
  }

  return response.arrayBuffer();
}
