# Development Workflow

## Setup
```bash
npm install
```

## Development
```bash
npm run dev
# Opens http://localhost:3000 with hot reload
```

## Production Build
```bash
npm run build
# Outputs to dist/ folder for OBS Browser Source
```

## OBS Usage
Point OBS Browser Source to: `file:///path/to/twitch-overlay/dist/index.html`

## Project Structure
- `src/` - TypeScript source files
- `resources/` - Static assets (images, audio)
- `dist/` - Built output for production
- `old-code/` - Legacy code for reference only