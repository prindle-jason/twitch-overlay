// core/mediaLoader.js
// Preloads images and exposes them via a cache

const imageCache = {};
const IMAGE_BASE_PATH = "resources/images/";
const imageMap = {
    bubFailure: "bubFailure.png",
    bobFailure: "bobFailure.png",
    bubSuccess: "bubSuccess.png",
    bobSuccess: "bobSuccess.png",
    dvdLogo: "dvdLogo.png",
    ssbmFailure: "ssbmFailure.png",
    ssbmSuccess: "ssbmSuccess.png",
    xJason: "xJason.svg",
    greenRupee: "greenRupee.png",
    blueRupee: "blueRupee.png",
    redRupee: "redRupee.png",
    zeldaChestBody: "zeldaChestBody.png",
    zeldaChestLid1: "zeldaChestLid1.png",
    zeldaChestLid2: "zeldaChestLid2.png",
    zeldaChestLid3: "zeldaChestLid3.png"
};

// Sound effect logic
const SOUND_BASE_PATH = "resources/audio/";
const soundMap = {
    bamHooray: "bustamove-hooray.mp3",
    bamUhOh: "bustamove-uhoh.mp3",
    partyHorn: "partyHorn.mp3",
    ssbmFailure: "ssbm-failure.mp3",
    ssbmSuccess: "ssbm-success.mp3",
    heavyRainJason: "heavyrain-jason.mp3",
    zeldaOpenChest: "zelda-open-chest.mp3",
    zeldaGetItem: "zelda-get-item.mp3"
};

const soundCache = {};

export function preloadResources() {
    preloadImages();
    preloadSounds();
}

function preloadSounds() {
    for (const [key, filename] of Object.entries(soundMap)) {
        const audio = new Audio(SOUND_BASE_PATH + filename);
        soundCache[key] = audio;
    }
}

export function getSound(key) {
    const audio = soundCache[key];
    return audio ? audio.cloneNode() : null;
}

export function getSoundDuration(key) {
    const audio = soundCache[key];
    if (audio && audio.duration) {
        return audio.duration * 1000; // Convert seconds to milliseconds
    }
    return 0; // Duration not available yet or sound not loaded
}

function preloadImages(onComplete) {
    for (const [key, filename] of Object.entries(imageMap)) {
        const img = new Image();
        img.src = IMAGE_BASE_PATH + filename;
        imageCache[key] = img;
    }
}

export function getImage(key) {
    return imageCache[key];
}
