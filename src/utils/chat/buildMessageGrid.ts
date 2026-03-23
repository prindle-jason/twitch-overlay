import { GridLayoutElement } from "../../elements/composites/GridLayoutElement";
import { TextElement } from "../../elements/primitives/TextElement";
import { ImageElement } from "../../elements/primitives/ImageElement";
import { buildMessageParts } from "./messageParts";
import { Emote } from "./chatTypes";

export interface MessageGridConfig {
  message: string;
  emotes: Emote[];
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  textColor: string;
  emoteHeight: number;
  gap: number;
}

/**
 * Build a GridLayoutElement containing text and emote elements from a chat message.
 */
export const buildMessageGrid = (
  config: MessageGridConfig,
): GridLayoutElement => {
  const parts = buildMessageParts(config.message, config.emotes);
  const grid = new GridLayoutElement({
    columns: 0,
    gap: config.gap,
    alignItems: "center",
  });

  for (const part of parts) {
    if (part.type === "text") {
      grid.addChild(
        new TextElement({
          text: part.content,
          font: config.fontFamily,
          fontSize: config.fontSize,
          fontWeight: config.fontWeight,
          color: config.textColor,
          textBaseline: "top",
        }),
      );
    } else {
      grid.addChild(
        new ImageElement({
          imageUrl: part.content,
          height: config.emoteHeight,
        }),
      );
    }
  }

  return grid;
};
