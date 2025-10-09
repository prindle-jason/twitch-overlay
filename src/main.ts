// TypeScript Twitch Overlay with Streamer.bot Manager
import { StreamerbotManager } from '@/managers/StreamerbotManager';

console.log('Twitch Overlay - TypeScript Foundation Ready!');

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (!ctx) {
  throw new Error('Could not get 2D context from canvas');
}

// Set canvas size
const W = 1280;
const H = 720;
canvas.width = W;
canvas.height = H;

// State management
let imageVisible = true;
let wsConnected = false;

// TODO: Future Enhancement - Replace callback pattern with EventBus integration
// When EventBus is implemented (Step 2), StreamerbotManager should emit events
// through the EventBus instead of using these callback functions for better decoupling.

// Streamer.bot connection manager
const streamerbot = new StreamerbotManager({
  host: '127.0.0.1',
  port: 8080,
  autoReconnect: true,
  onConnectionChange: (connected, info) => {
    wsConnected = connected;
    if (connected && info) {
      console.log('🎯 Streamer.bot connection established:', info.name, info.version);
    }
  },
  onCommand: (command, data) => {
    console.log('🎮 Received command:', command, data);
    
    // Handle specific commands
    switch (command) {
      case 'toggle':
        imageVisible = !imageVisible;
        console.log(`🖼️ Image visibility toggled: ${imageVisible}`);
        break;
      
      default:
        console.log('❓ Unknown command:', command);
    }
  },
  onError: (error) => {
    console.error('💥 Streamer.bot error:', error);
  }
});

// Add manual test for debugging
window.addEventListener('keydown', (event) => {
  if (event.key === 't' || event.key === 'T') {
    imageVisible = !imageVisible;
    console.log(`🔧 Manual toggle test: ${imageVisible}`);
  }
});

// Load and render an image
const img = new Image();
img.onload = () => {
  console.log('Image loaded successfully');
  render();
};
img.onerror = (e) => {
  console.error('Failed to load image:', e);
  render(); // Still render without image
};

// Start with X Jason logo - changed from DVD to test hot reload
img.src = '/images/blueRupee.png';

function render() {
  if (!ctx) return;
  
  // Clear canvas
  ctx.clearRect(0, 0, W, H);
  
  // Dark background for visibility
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, W, H);
  
  // Connection status indicator
  ctx.fillStyle = wsConnected ? 'green' : 'red';
  ctx.fillRect(10, 10, 20, 20);
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(wsConnected ? 'Streamer.bot Connected (Manager Class)' : 'Streamer.bot Disconnected', 40, 25);
  
  // Render image if loaded and visible
  if (img.complete && img.naturalWidth > 0 && imageVisible) {
    const imgX = (W - img.width) / 2;
    const imgY = (H - img.height) / 2;
    ctx.drawImage(img, imgX, imgY);
    
    // Add text below image
    ctx.fillStyle = 'white';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Image Visible - StreamerbotManager Class', W / 2, imgY + img.height + 50);
  } else if (!imageVisible) {
    // Show hidden message
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Image Hidden - Send "toggle" command', W / 2, H / 2);
  } else {
    // Fallback text if image doesn't load
    ctx.fillStyle = 'white';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Image Loading...', W / 2, H / 2);
  }
  
  // Instructions
  ctx.fillStyle = 'yellow';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Using StreamerbotManager class - Send {"command": "toggle"} via CPH.WebsocketBroadcastJson()', W / 2, H - 30);
  
  requestAnimationFrame(render);
}

render();