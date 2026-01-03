/**
 * Represents a badge displayed next to a username (mod, subscriber, VIP, etc.)
 * Matches Twitch.Common.Models.Badge structure from Streamer.bot
 */
export interface Badge {
  name: string; // Badge name: 'moderator', 'subscriber', 'vip', 'broadcaster', etc.
  version: number; // Badge version (usually 0 or 1)
  imageUrl: string; // URL to badge image
}

/**
 * Represents an emote within a chat message
 * Matches Twitch.Common.Models.Emote structure from Streamer.bot
 */
export interface Emote {
  name: string; // e.g., 'KappaPride', 'DededeLUL'
  type: string; // 'Twitch', 'BTTVChannel', 'BTTVGlobal', '7TV', 'FFZ', etc.
  startIndex: number; // Character position where emote starts in the message
  endIndex: number; // Character position where emote ends
  imageUrl: string; // URL to emote image
  id?: string | number; // Emote ID (numeric for Twitch globals, string for custom, null for third-party)
}

/**
 * Represents a single chat message with all metadata
 * Designed to work with both Streamer.bot data and fake chat generation
 */
export interface ChatMessage {
  userId: string; // Unique identifier for the user
  username: string; // Display name shown in chat (case-sensitive)
  usernameLogin?: string; // Login name (lowercase, optional)
  message: string; // The actual message content (emotes rendered at their positions)
  messageStripped?: string; // Message with emotes removed (optional)
  badges?: Badge[]; // Array of badges
  emotes?: Emote[]; // Array of emotes with positions
  timestamp: number; // When the message was created (ms since epoch)
  color: string; // Username color (hex format: '#FF69B4')
  role?: number; // User role: 1=Viewer, 2=VIP, 3=Moderator, 4=Broadcaster
  isSubscriber?: boolean; // Is user subscribed?
  isModerator?: boolean; // Is user a moderator?
  isVip?: boolean; // Is user a VIP?
  isFirstMessage?: boolean; // Is this user's first message?
  bits?: number; // Bits donated in message (if any)
}

/**
 * Abstract provider for chat messages.
 * Implement this to create fake chat or integrate with real chat sources.
 */
export abstract class ChatDataProvider {
  /**
   * Generate or retrieve a batch of chat messages
   * @param count Number of messages to generate/retrieve
   * @returns Array of chat messages
   */
  abstract generateMessages(count: number): ChatMessage[];

  /**
   * Optional: Get the next message in sequence (for streaming providers)
   */
  getNextMessage?(): ChatMessage | null;

  /**
   * Optional: Check if more messages are available
   */
  hasMore?(): boolean;
}

/**
 * Simple emote metadata for fake chat generation
 * Note: For real chat from Streamer.bot, emote data comes pre-populated in ChatMessage.emotes
 */
export interface EmoteData {
  name: string; // Emote name/code
  imageUrl: string; // URL to emote image
  type: string; // 'Twitch', 'BTTVChannel', '7TV', etc.
}

/**
 * Registry for managing emotes in fake chat generation
 * For real chat, Streamer.bot handles emote resolution automatically
 */
export class EmoteRegistry {
  private emotes: EmoteData[] = [];

  /**
   * Add emotes to the registry (for fake chat generation)
   */
  addEmotes(emotes: EmoteData[]): void {
    this.emotes.push(...emotes);
  }

  /**
   * Get a random emote from the registry
   */
  getRandomEmote(): EmoteData | null {
    if (this.emotes.length === 0) return null;
    return this.emotes[Math.floor(Math.random() * this.emotes.length)];
  }

  /**
   * Get all available emote names
   */
  getAvailableEmotes(): string[] {
    return this.emotes.map((e) => e.name);
  }

  /**
   * Get emote by name
   */
  getEmote(name: string): EmoteData | null {
    return this.emotes.find((e) => e.name === name) || null;
  }

  /**
   * Get all emotes
   */
  getAllEmotes(): EmoteData[] {
    return [...this.emotes];
  }
}
