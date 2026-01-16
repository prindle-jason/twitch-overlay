import { SceneElement } from "./SceneElement";
import { ImageElement } from "../ImageElement";
import { TextElement } from "../TextElement";
import { GridLayoutElement } from "../GridLayoutElement";

/**
 * Test scene for ImageElement with various URL types
 */
export class ImageTestScene extends SceneElement {
  readonly type = "newImageTest" as const;
  override async init(): Promise<void> {
    const testCases: Array<{
      name: string;
      url: string;
      description: string;
    }> = [
      {
        name: "Local Resource (PNG with extension)",
        url: "/images/bubSuccess.png",
        description: "Local resource with extension - should load directly",
      },
      {
        name: "External with Extension (Animated WebP)",
        url: "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.webp",
        description: "External URL with extension - extension detection",
      },
      {
        name: "External without Extension (Twitch Badge)",
        url: "https://static-cdn.jtvnw.net/badges/v1/5d9f2208-5dd8-11e7-8513-2ff4adfae661/3",
        description: "External URL without extension - Content-Type detection",
      },
      {
        name: "External without Extension (BTTV GIF emote)",
        url: "https://cdn.betterttv.net/emote/60a6d39e67644f1d67e89f2d/3x",
        description: "External URL without extension - Content-Type detection",
      },
      {
        name: "External Animated GIF (with extension)",
        url: "https://cdn.betterttv.net/emote/5ada077451d4120ea3918426/3x.gif",
        description: "External animated GIF with extension",
      },
      {
        name: "Bad URL (should fail gracefully)",
        url: "https://invalid-domain-that-does-not-exist.example.com/image.png",
        description: "Invalid URL - should error during init",
      },
    ];

    let yPosition = 50;
    const xStart = 50;
    const imageSize = 40; // height for images
    const spacing = 150; // vertical spacing between test cases

    for (const testCase of testCases) {
      // Label
      const label = new TextElement({
        text: testCase.name,
        fontSize: 16,
        color: "#ffffff",
      });
      label.x = xStart;
      label.y = yPosition;
      this.addChild(label);

      // Description
      const desc = new TextElement({
        text: testCase.description,
        fontSize: 12,
        color: "#cccccc",
      });
      desc.x = xStart;
      desc.y = yPosition + 20;
      this.addChild(desc);

      // Image
      const img = new ImageElement({ imageUrl: testCase.url });
      img.x = xStart + 400; // Offset to the right
      img.y = yPosition + 10;
      img.setScale(3.0);
      // Don't set scale here - let it render at natural size
      this.addChild(img);

      yPosition += spacing;
    }

    await super.init();
  }
}
