import { ChatDataProvider, ChatMessage, Badge, Emote } from "./chatTypes";

/**
 * Generates fake chat messages for testing and demonstration
 */
export class FakeChatProvider extends ChatDataProvider {
  private messageTemplates = [
    "nice play!",
    "Pog",
    "no way",
    "sick",
    "GOOOOO",
    "let's go!",
    "huge W",
    "gg",
    "what a moment",
    "insane",
    "yoooo",
    "clip it",
    "same",
    "rip",
    "lmao",
    "based",
  ];

  private emotes = [
    {
      name: "KappaPride",
      type: "Twitch",
      imageUrl:
        "https://static-cdn.jtvnw.net/emoticons/v2/55338/default/dark/2.0",
      id: 55338,
    },
    {
      name: "prndddLoading",
      type: "Twitch",
      imageUrl:
        "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_11fb52f3a8cc41d2bb599c22a8890c60/default/dark/2.0",
      id: "emotesv2_11fb52f3a8cc41d2bb599c22a8890c60",
    },
    {
      name: "thasixCry",
      type: "Twitch",
      imageUrl:
        "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_2a83bde9f241421cb0ef6db5750c667e/default/dark/2.0",
      id: "emotesv2_2a83bde9f241421cb0ef6db5750c667e",
    },
    {
      name: "DededeLUL",
      type: "BTTVChannel",
      imageUrl: "https://cdn.betterttv.net/emote/60a6d39e67644f1d67e89f2d/3x",
    },
  ];

  private usernameAdjectives = [
    "Swift",
    "Rapid",
    "Shadow",
    "Mystic",
    "Silent",
    "Bright",
    "Dark",
    "Fierce",
    "Quick",
    "Smart",
  ];

  private usernameNouns = [
    "Panda",
    "Wolf",
    "Fox",
    "Eagle",
    "Tiger",
    "Dragon",
    "Phoenix",
    "Raven",
    "Bear",
    "Hawk",
  ];

  private colors = [
    "#FF0000", // Red
    "#0000FF", // Blue
    "#00FF00", // Green
    "#FF7F00", // Orange
    "#9400D3", // Violet
    "#00FFFF", // Cyan
    "#FF1493", // Deep Pink
    "#FFD700", // Gold
    "#00CED1", // Dark Turquoise
    "#FF69B4", // Hot Pink
  ];

  private badgePool = [
    { name: "moderator", version: 1 },
    { name: "subscriber", version: 0 },
    { name: "vip", version: 1 },
  ];

  /**
   * Generate a consistent color based on username hash
   */
  private generateColorForUsername(username: string): string {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = (hash << 5) - hash + username.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % this.colors.length;
    return this.colors[index];
  }

  /**
   * Generate a random username
   */
  private generateUsername(): string {
    const adjective =
      this.usernameAdjectives[
        Math.floor(Math.random() * this.usernameAdjectives.length)
      ];
    const noun =
      this.usernameNouns[Math.floor(Math.random() * this.usernameNouns.length)];
    const number = Math.floor(Math.random() * 10000);
    return `${adjective}${noun}${number}`;
  }

  /**
   * Generate a random message, optionally with emotes inserted
   */
  private generateMessage(): { text: string; emotes: Emote[] } {
    let messageText =
      this.messageTemplates[
        Math.floor(Math.random() * this.messageTemplates.length)
      ];

    const emotes: Emote[] = [];

    // 40% chance to insert 1-2 emotes
    if (Math.random() < 0.4) {
      const emoteCount = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < emoteCount; i++) {
        const emote =
          this.emotes[Math.floor(Math.random() * this.emotes.length)];
        const startIndex = messageText.length;
        messageText += ` ${emote.name}`;
        const endIndex = messageText.length;

        emotes.push({
          name: emote.name,
          type: emote.type,
          imageUrl: emote.imageUrl,
          startIndex,
          endIndex,
          id: emote.id,
        });
      }
    }

    return { text: messageText, emotes };
  }

  /**
   * Generate random badges for a message
   */
  private generateBadges(): Badge[] {
    const badges: Badge[] = [];
    // 20% chance for each badge type
    this.badgePool.forEach((badge) => {
      if (Math.random() < 0.2) {
        badges.push({
          name: badge.name,
          version: badge.version,
          imageUrl: `https://static-cdn.jtvnw.net/badges/v1/${badge.name}/3`,
        });
      }
    });
    return badges;
  }

  /**
   * Generate a batch of fake chat messages
   */
  generateMessages(count: number): ChatMessage[] {
    const messages: ChatMessage[] = [];

    for (let i = 0; i < count; i++) {
      const username = this.generateUsername();
      const color = this.generateColorForUsername(username);
      const { text: message, emotes } = this.generateMessage();

      messages.push({
        userId: `fake-user-${i}`,
        username,
        usernameLogin: username.toLowerCase(),
        message,
        color,
        timestamp: Date.now() + i * 100, // Stagger timestamps
        badges: this.generateBadges(),
        emotes: emotes.length > 0 ? emotes : undefined,
      });
    }

    return messages;
  }
}
