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
  ps2Sound: "/audio/dvd/ps2.mp3",
  thxSound: "/audio/dvd/thx.mp3",
  discordSound: "/audio/dvd/discord.mp3",

  // NyanFollowerScene
  // Replace with dedicated nyan audio assets when available.
  nyanMusic: "/audio/nyanFollower.mp3",
  nyanStar: "/audio/yippee.mp3",

  // Friend sounds
  ashShaun: "/audio/friends/did-you-see-shaun.mp3",
  meghHoa: "/audio/friends/meghHoa.mp3",
  silasRobotHouse: "/audio/friends/robot-house.mp3",
  mkInsane: "/audio/friends/oh-my-god-shes-insane.mp3",

  // Watermark sounds
  jojoToBeContinued: "/audio/watermarks/jojo-to-be-continued.mp3",
} as const;

// Folders of sounds to randomly choose from, rather than a single fixed file.
export const soundFolders = {
  xJasonRandom: Array.from(
    { length: 19 },
    (_, i) => `/audio/xJason/${i + 1}.mp3`,
  ),
} as const;
