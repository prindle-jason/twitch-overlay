import { ChatDataProvider, ChatMessage, Badge, Emote } from "./chatTypes";
import {
  messageTemplates,
  emotes,
  usernameAdjectives,
  usernameNouns,
  usernameColors,
  badgePool,
} from "./fakeChatData";

/**
 * Generates fake chat messages for testing and demonstration
 */
export class FakeChatProvider extends ChatDataProvider {
  private messageTemplates = messageTemplates;
  private emotes = emotes;
  private usernameAdjectives = usernameAdjectives;
  private usernameNouns = usernameNouns;
  private colors = usernameColors;
  private badgePool = badgePool;

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
   * Generate a random username with various formats
   */
  private generateUsername(): string {
    const adjective =
      this.usernameAdjectives[
        Math.floor(Math.random() * this.usernameAdjectives.length)
      ];
    const noun =
      this.usernameNouns[Math.floor(Math.random() * this.usernameNouns.length)];
    const number = Math.floor(Math.random() * 10000);
    const smallNumber = Math.floor(Math.random() * 100);

    // Pick a random format
    const format = Math.floor(Math.random() * 8);

    switch (format) {
      case 0: // AdjectiveNoun1234
        return `${adjective}${noun}${number}`;
      case 1: // Noun1234 (no adjective)
        return `${noun}${number}`;
      case 2: // AdjectiveNoun (no numbers)
        return `${adjective}${noun}`;
      case 3: // adjective_noun_12
        return `${adjective.toLowerCase()}_${noun.toLowerCase()}_${smallNumber}`;
      case 4: // xX_AdjectiveNoun_Xx (gamer tag style)
        return `xX_${adjective}${noun}_Xx`;
      case 5: // TheAdjectiveNoun
        return `The${adjective}${noun}`;
      case 6: // Adjective_Noun
        return `${adjective}_${noun}`;
      case 7: // Leetspeak variations
        const leetAdjective = adjective
          .replace(/o/gi, "0")
          .replace(/e/gi, "3")
          .replace(/a/gi, "4");
        const leetNoun = noun
          .replace(/o/gi, "0")
          .replace(/e/gi, "3")
          .replace(/a/gi, "4");
        return `${leetAdjective}${leetNoun}${smallNumber}`;
      default:
        return `${adjective}${noun}${number}`;
    }
  }

  /**
   * Generate a random message, optionally with emotes inserted
   */
  private createMessage(): { text: string; emotes: Emote[] } {
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
          startIndex: startIndex,
          endIndex: endIndex,
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

    // Different probabilities for each badge type
    this.badgePool.forEach((badge) => {
      let chance = 0;
      if (badge.name === "broadcaster") {
        chance = 0.001; // 0.1%
      } else if (badge.name === "moderator") {
        chance = 0.01; // 1%
      } else if (badge.name === "subscriber") {
        chance = 0.3; // 30%
      }

      if (Math.random() < chance) {
        badges.push({
          name: badge.name,
          version: badge.version,
          imageUrl: badge.imageUrl,
        });
      }
    });
    return badges;
  }

  generateMessage(): ChatMessage {
    const username = this.generateUsername();
    const color = this.generateColorForUsername(username);
    const { text: message, emotes } = this.createMessage();

    return {
      username,
      usernameLogin: username.toLowerCase(),
      message,
      color,
      timestamp: Date.now(),
      badges: this.generateBadges(),
      emotes: emotes.length > 0 ? emotes : undefined,
    };
  }

  /**
   * Generate a batch of fake chat messages
   */
  generateMessages(count: number): ChatMessage[] {
    const messages: ChatMessage[] = [];

    for (let i = 0; i < count; i++) {
      messages.push(this.generateMessage());
    }

    return messages;
  }
}
