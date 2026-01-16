import { SceneElement } from "./SceneElement";
import { RichTextElement } from "../RichTextElement";
import { GridLayoutElement } from "../GridLayoutElement";
import { TextElement } from "../TextElement";
import { ImageElement } from "../ImageElement";
import { Emote } from "../../utils/chat/chatTypes";

/**
 * Test scene for RichTextElement with various configurations
 */
export class RichTextTestScene extends SceneElement {
  readonly type = "richTextTest" as const;
  private pendingScales: Array<{
    image: ImageElement;
    targetHeight: number;
  }> = [];

  override async init(): Promise<void> {
    const tests: Array<{
      name: string;
      text: string;
      emotes: Emote[];
      config: {
        fontSize?: number;
        color?: string;
        font?: string;
        fontWeight?: string;
        textBaseline?: CanvasTextBaseline;
        emoteHeight?: number;
        emotePadding?: number;
      };
    }> = [
      {
        name: "Text with emote",
        text: "Hello catJAM world",
        emotes: [
          {
            name: "catJAM",
            imageUrl:
              "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.gif",
            startIndex: 6,
            endIndex: 11,
          },
        ],
        config: {
          fontSize: 28,
          color: "#ffff00",
          emoteHeight: 32,
          emotePadding: 4,
        },
      },
      {
        name: "Multiple emotes",
        text: "catJAM blobDance catJAM",
        emotes: [
          {
            name: "catJAM",
            imageUrl:
              "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.webp",
            startIndex: 0,
            endIndex: 5,
          },
          {
            name: "blobDance",
            imageUrl:
              "https://cdn.betterttv.net/emote/5ada077451d4120ea3918426/3x.webp",
            startIndex: 7,
            endIndex: 15,
          },
          {
            name: "catJAM",
            imageUrl:
              "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.webp",
            startIndex: 17,
            endIndex: 22,
          },
        ],
        config: {
          fontSize: 24,
          color: "#00ff00",
          emoteHeight: 28,
          emotePadding: 2,
        },
      },
      {
        name: "Emote only",
        text: "blobDance",
        emotes: [
          {
            name: "blobDance",
            imageUrl:
              "https://cdn.betterttv.net/emote/5ada077451d4120ea3918426/3x.webp",
            startIndex: 0,
            endIndex: 8,
          },
        ],
        config: {
          fontSize: 24,
          color: "#ff00ff",
          emoteHeight: 48,
          emotePadding: 4,
        },
      },
      {
        name: "Bad emote URL",
        text: "Hello catJAM world",
        emotes: [
          {
            name: "catJAM",
            imageUrl: "http://invalid-url.example.com/3x.webp",
            startIndex: 6,
            endIndex: 11,
          },
        ],
        config: {
          fontSize: 28,
          color: "#ffff00",
          emoteHeight: 32,
          emotePadding: 4,
        },
      },
      {
        name: "Bad extension",
        text: "Hello catJAM world",
        emotes: [
          {
            name: "catJAM",
            imageUrl: "https://www.gstatic.com/webp/gallery/1.sm.badwebp",
            startIndex: 6,
            endIndex: 11,
          },
        ],
        config: {
          fontSize: 28,
          color: "#ffff00",
          emoteHeight: 32,
          emotePadding: 4,
        },
      },
    ];

    const columnX = {
      name: 50,
      existing: 400,
      grid: 900,
    };
    const startY = 50;
    const rowGap = 60;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const y = startY + i * rowGap;

      const label = new TextElement({
        text: test.name,
        fontSize: 22,
        color: "#ffffff",
        fontWeight: "bold",
      });
      label.x = columnX.name;
      label.y = y;
      this.addChild(label);

      const existing = new RichTextElement(test.text, test.emotes, test.config);
      existing.x = columnX.existing;
      existing.y = y;
      this.addChild(existing);

      const gridVersion = this.createGridRichText(
        test.text,
        test.emotes,
        test.config
      );
      gridVersion.x = columnX.grid;
      gridVersion.y = y;
      this.addChild(gridVersion);
    }

    await super.init();
  }

  override play(): void {
    for (const pending of this.pendingScales) {
      const h = pending.image.getHeight() ?? 0;
      if (h > 0) {
        pending.image.setScale(pending.targetHeight / h);
      }
    }

    super.play();
  }

  private createGridRichText(
    text: string,
    emotes: Emote[],
    config: {
      fontSize?: number;
      color?: string;
      font?: string;
      fontWeight?: string;
      textBaseline?: CanvasTextBaseline;
      emoteHeight?: number;
      emotePadding?: number;
    }
  ): GridLayoutElement {
    const fontSize = config.fontSize ?? 24;
    const color = config.color ?? "#ffffff";
    const font = config.font ?? "Arial";
    const fontWeight = config.fontWeight ?? "normal";
    const textBaseline = config.textBaseline ?? "middle";
    const emoteHeight = config.emoteHeight ?? fontSize;
    const emotePadding = config.emotePadding ?? 2;

    const grid = new GridLayoutElement({
      columns: 0,
      gap: emotePadding,
      alignItems: "center",
    });

    const sorted = [...emotes].sort((a, b) => a.startIndex - b.startIndex);
    let cursor = 0;
    for (const emote of sorted) {
      if (cursor < emote.startIndex) {
        const chunk = text.substring(cursor, emote.startIndex);
        if (chunk) {
          grid.addChild(
            new TextElement({
              text: chunk,
              font,
              fontSize,
              fontWeight,
              color,
              textBaseline,
            })
          );
        }
        cursor = emote.startIndex;
      }

      try {
        const image = new ImageElement({ imageUrl: emote.imageUrl });
        this.pendingScales.push({ image, targetHeight: emoteHeight });
        //await image.init();
        grid.addChild(image);
      } catch (err) {
        const fallback = text.substring(emote.startIndex, emote.endIndex + 1);
        if (fallback) {
          grid.addChild(
            new TextElement({
              text: fallback,
              font,
              fontSize,
              fontWeight,
              color,
              textBaseline,
            })
          );
        }
      }
      cursor = emote.endIndex + 1;
    }

    if (cursor < text.length) {
      const tail = text.substring(cursor);
      if (tail) {
        grid.addChild(
          new TextElement({
            text: tail,
            font,
            fontSize,
            fontWeight,
            color,
            textBaseline,
          })
        );
      }
    }

    return grid;
  }
}
