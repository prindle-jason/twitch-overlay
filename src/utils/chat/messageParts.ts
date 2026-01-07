import type { ChatMessage, Emote } from "./chatTypes";

export type MessagePartText = {
  type: "text";
  content: string;
};

export type MessagePartEmote = {
  type: "emote";
  content: string; // image URL
  name?: string;
  start?: number;
  end?: number;
};

export type MessagePart = MessagePartText | MessagePartEmote;

/**
 * Build ordered message parts from raw message string and emote ranges.
 * - Parts are in display order
 * - Text parts contain the literal string
 * - Emote parts contain the image URL (content) and optional metadata
 *
 * Overlap handling:
 * - Emotes are sorted by start index
 * - Emotes that start before the current index are clamped to current index
 * - Emotes with invalid ranges are skipped
 */
export function buildMessageParts(
  message: string,
  emotes: Emote[] = []
): MessagePart[] {
  const parts: MessagePart[] = [];

  const msgLen = message.length;
  const sorted = [...emotes].sort((a, b) => a.startIndex - b.startIndex);

  let cursor = 0;

  for (const emote of sorted) {
    // Validate and normalize indices
    let start = Math.max(0, Math.min(emote.startIndex, msgLen - 1));
    let end = Math.max(0, Math.min(emote.endIndex, msgLen - 1));

    if (start > end) {
      // Invalid range; skip
      continue;
    }

    // If we have text before the first emote
    if (cursor < start) {
      const textSlice = message.substring(cursor, start);
      if (textSlice.length > 0) {
        parts.push({ type: "text", content: textSlice });
      }
      cursor = start;
    }

    // Emit emote part
    parts.push({
      type: "emote",
      content: emote.imageUrl,
      name: emote.name,
      start: start,
      end: end,
    });

    // Advance cursor past emote
    cursor = end + 1;
  }

  // Trailing text
  if (cursor < msgLen) {
    const tail = message.substring(cursor);
    if (tail.length > 0) {
      parts.push({ type: "text", content: tail });
    }
  }

  return parts;
}

/**
 * Convenience wrapper for ChatMessage.
 */
export function buildMessagePartsFromChat(chat: ChatMessage): MessagePart[] {
  return buildMessageParts(chat.message, chat.emotes ?? []);
}
