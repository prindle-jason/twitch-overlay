import { SceneElement } from "./SceneElement";
import { RichTextElement } from "../RichTextElement";
import { FadeInOutBehavior } from "../behaviors/FadeInOutBehavior";
import type { EmoteData } from "../RichTextElement";

/**
 * Test scene for RichTextElement with various configurations
 */
export class RichTextTestScene extends SceneElement {
  override async init(): Promise<void> {
    // Test 1: Text only
    const textOnly = new RichTextElement("Plain text only", [], {
      fontSize: 32,
      color: "#ffffff",
    });
    textOnly.y = 100;
    textOnly.x = 960;
    //textOnly.addChild(new FadeInOutBehavior({ fadeTime: 0.3 }));
    this.addChild(textOnly);

    // Test 2: Text with emote
    const textWithEmote = new RichTextElement(
      "Hello catJAM world",
      [
        {
          name: "catJAM",
          url: "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.gif",
          start: 6,
          end: 11,
        } as EmoteData,
      ],
      { fontSize: 28, color: "#ffff00", emoteHeight: 32, emotePadding: 4 }
    );
    textWithEmote.y = 200;
    textWithEmote.x = 960;
    //textWithEmote.addChild(new FadeInOutBehavior({ fadeTime: 0.3 }));
    this.addChild(textWithEmote);

    // Test 3: Multiple emotes
    const multiEmotes = new RichTextElement(
      "catJAM blobDance catJAM",
      [
        {
          name: "catJAM",
          url: "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.webp",
          start: 0,
          end: 5,
        } as EmoteData,
        {
          name: "blobDance",
          url: "https://cdn.betterttv.net/emote/5ada077451d4120ea3918426/3x.webp",
          start: 7,
          end: 15,
        } as EmoteData,
        {
          name: "catJAM",
          url: "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/3x.webp",
          start: 17,
          end: 22,
        } as EmoteData,
      ],
      { fontSize: 24, color: "#00ff00", emoteHeight: 28, emotePadding: 2 }
    );
    multiEmotes.y = 300;
    multiEmotes.x = 960;
    //multiEmotes.addChild(new FadeInOutBehavior({ fadeTime: 0.3 }));
    this.addChild(multiEmotes);

    // Test 4: Emote only
    const emoteOnly = new RichTextElement(
      "blobDance",
      [
        {
          name: "blobDance",
          url: "https://cdn.betterttv.net/emote/5ada077451d4120ea3918426/3x.webp",
          start: 0,
          end: 8,
        } as EmoteData,
      ],
      { fontSize: 24, color: "#ff00ff", emoteHeight: 48 }
    );
    emoteOnly.y = 400;
    emoteOnly.x = 960;
    //emoteOnly.addChild(new FadeInOutBehavior({ fadeTime: 0.3 }));
    this.addChild(emoteOnly);

    // Test 5: Text alignment - left
    const alignLeft = new RichTextElement("Left aligned", [], {
      fontSize: 24,
      color: "#ff6b6b",
      textAlign: "left",
    });
    alignLeft.y = 500;
    alignLeft.x = 100;
    //alignLeft.addChild(new FadeInOutBehavior({ fadeTime: 0.3 }));
    this.addChild(alignLeft);

    // Test 6: Text alignment - right
    const alignRight = new RichTextElement("Right aligned", [], {
      fontSize: 24,
      color: "#6b9bff",
      textAlign: "right",
    });
    alignRight.y = 550;
    alignRight.x = 1820;
    //alignRight.addChild(new FadeInOutBehavior({ fadeTime: 0.3 }));
    this.addChild(alignRight);

    //this.duration = 6;
    await super.init();
  }
}
