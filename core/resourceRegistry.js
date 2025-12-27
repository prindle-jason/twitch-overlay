// core/resourceRegistry.js
// Simple registry for media assets - no preloading, browser loads on-demand

const IMAGE_BASE_PATH = "resources/images/";
const WATERMARK_PATH = IMAGE_BASE_PATH + "watermarks/";
const SOUND_BASE_PATH = "resources/audio/";

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
};

const watermarkMap = {
  activateWindows: "activateWindows.png",
  gettyImages: "gettyImages.png",
  hypercam: "hypercam.png",
  notLive: "notLive.png",
  seelWatermark: "seelWatermark.png",
  stockImage: "stockImage.png",
  toBeContinued: "toBeContinued.png",
  viewerDiscretion: "viewerDiscretionWatermark.png",
};

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
};

/**
 * Get an Image element for the specified key
 */
export function getImage(key) {
  const filename = imageMap[key];
  if (!filename) return null;

  const img = new Image();
  img.src = IMAGE_BASE_PATH + filename;
  return img;
}

/**
 * Get an Audio element for the specified key
 */
export function getSound(key) {
  const filename = soundMap[key];
  if (!filename) return null;

  const audio = new Audio(SOUND_BASE_PATH + filename);
  return audio;
}

/**
 * Get a watermark Image element for the specified key
 */
export function getWatermark(key) {
  const filename = watermarkMap[key];
  if (!filename) return null;

  const img = new Image();
  img.src = WATERMARK_PATH + filename;
  return img;
}
