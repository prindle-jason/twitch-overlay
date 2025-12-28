// Simple registry for media assets - no preloading, browser loads on-demand

// Vite serves publicDir at web root; resources are mounted at '/'
const IMAGE_BASE_PATH = "/images/";
const SOUND_BASE_PATH = "/audio/";

const imageMap = {
  bubFailure: "bubFailure.png",
  bobFailure: "bobFailure.png",
  bubSuccess: "bubSuccess.png",
  bobSuccess: "bobSuccess.png",
  dvdLogo: "dvdLogo.png",
  bluRayLogo: "bluRayLogo.png",
  ssbmFailure: "ssbmFailure.png",
  ssbmSuccess: "ssbmSuccess.png",
  xJason: "xJason.svg",
  breakingNews: "breakingNews.png",
  hb1: "headblade/hb1.png",
  hb2: "headblade/hb2.png",
  hb3: "headblade/hb3.png",
  hb4: "headblade/hb4.png",
  hb5: "headblade/hb5.png",
  activateWindows: "watermarks/activateWindows.png",
  gettyImages: "watermarks/gettyImages.png",
  hypercam: "watermarks/hypercam.png",
  notLive: "watermarks/notLive.png",
  seelWatermark: "watermarks/seelWatermark.png",
  stockImage: "watermarks/stockImage.png",
  toBeContinued: "watermarks/toBeContinued.png",
  viewerDiscretion: "watermarks/viewerDiscretionWatermark.png",
} as const;

export type ImageKey = keyof typeof imageMap;

const soundMap = {
  bamHooray: "bustamove-hooray.mp3",
  bamUhOh: "bustamove-uhoh.mp3",
  breakingNews: "breakingNews.mp3",
  headblade: "headblade.mp3",
  heavyRainJason: "heavyrain-jason.mp3",
  partyHorn: "partyHorn.mp3",
  ssbmFail: "ssbm-failure.mp3",
  ssbmSuccess: "ssbm-success.mp3",
  tickerSound: "ticker-sound.mp3",
  yippee: "yippee.mp3",
} as const;

export type SoundKey = keyof typeof soundMap;

/**
 * Get a loaded Image element for the specified key (cached, resolves when loaded)
 */
export function getImage(key: ImageKey): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const filename = imageMap[key];
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${key}`));
    img.src = IMAGE_BASE_PATH + filename;
  });
}

/**
 * Get an Audio element for the specified key (resolves when creatable)
 */
export function getSound(key: SoundKey): Promise<HTMLAudioElement> {
  return Promise.resolve(new Audio(SOUND_BASE_PATH + soundMap[key]));
}
