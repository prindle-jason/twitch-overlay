// Centralized sound asset registry used by overlay and dashboard.
export const localSounds = {
  bamHooray: "/audio/bustamove-hooray.mp3",
  bamUhOh: "/audio/bustamove-uhoh.mp3",
  breakingNews: "/audio/breakingNews.mp3",
  headblade: "/audio/headblade.mp3",
  heavyRainJason: "/audio/heavyrain-jason.mp3",

  ssbmFail: "/audio/ssbm-failure.mp3",
  ssbmSuccess: "/audio/ssbm-success.mp3",
  tickerSound: "/audio/ticker-sound.mp3",

  // DVD Scene
  partyHorn: "/audio/partyHorn.mp3",
  yippee: "/audio/yippee.mp3",

  gamecubeSound: "/audio/dvd/gamecube.mp3",
  netflixSound: "/audio/dvd/netflix.mp3",
  prndddo: "/audio/dvd/prndddo.wav",
  ps1Sound: "/audio/dvd/playstation1.mp3",
  thxSound: "/audio/dvd/thx.mp3",

  // NyanFollowerScene
  // Replace with dedicated nyan audio assets when available.
  nyanMusic: "/audio/nyanFollower.mp3",
  nyanStar: "/audio/yippee.mp3",
} as const;
