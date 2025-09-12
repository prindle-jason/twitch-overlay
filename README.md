# twitch-overlay

This project provides a unified overlay system for Twitch streams, including visual and audio effects triggered by events.

## Features
- Web-based overlay for streamers
- Visual and sound effects (preloaded, not tracked in git)
- HTTP and WebSocket server for event handling

## Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Place required images and audio files in the `resources/` directory (see `.gitignore`).
4. Start the server with `npm start`.

## Note
Resource files (images, audio) are not included in the repository. Add your own to `resources/images/` and `resources/audio/` as needed.