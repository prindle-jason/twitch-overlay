/**
 * Render Command Protocol Types
 * 
 * Defines the interface between the server (scene manager) and clients (renderers).
 * Server sends high-level drawing instructions to clients for synchronized rendering.
 */

export interface BaseRenderCommand {
  id: string;
  timestamp: number;
  frameId: number;
}

export interface ClearCanvasCommand extends BaseRenderCommand {
  type: 'clearCanvas';
  fillStyle?: string; // Optional background color
}

export interface DrawImageCommand extends BaseRenderCommand {
  type: 'drawImage';
  resourceId: string; // Reference to image resource on client
  x: number;
  y: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number; // Radians
  scaleX?: number;
  scaleY?: number;
}

export interface DrawTextCommand extends BaseRenderCommand {
  type: 'drawText';
  text: string;
  x: number;
  y: number;
  font: string; // CSS font string
  fillStyle: string; // Color/gradient
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  maxWidth?: number;
  strokeStyle?: string;
  lineWidth?: number;
}

export interface DrawShapeCommand extends BaseRenderCommand {
  type: 'drawShape';
  shape: 'rectangle' | 'circle' | 'ellipse';
  x: number;
  y: number;
  width: number;
  height: number;
  fillStyle?: string;
  strokeStyle?: string;
  lineWidth?: number;
}

export interface PlayAudioCommand extends BaseRenderCommand {
  type: 'playAudio';
  resourceId: string; // Reference to audio resource on client
  volume?: number;
  loop?: boolean;
}

export interface SetCanvasEffectCommand extends BaseRenderCommand {
  type: 'setCanvasEffect';
  effect: 'blur' | 'brightness' | 'contrast' | 'hue-rotate' | 'saturate';
  value: string; // CSS filter value
}

export interface ResourceLoadCommand extends BaseRenderCommand {
  type: 'loadResource';
  resourceId: string;
  resourceType: 'image' | 'audio';
  url: string;
}

export interface ResourceUnloadCommand extends BaseRenderCommand {
  type: 'unloadResource';
  resourceId: string;
}

export type RenderCommand = 
  | ClearCanvasCommand
  | DrawImageCommand
  | DrawTextCommand
  | DrawShapeCommand
  | PlayAudioCommand
  | SetCanvasEffectCommand
  | ResourceLoadCommand
  | ResourceUnloadCommand;

/**
 * Render Frame - A collection of commands to execute together
 */
export interface RenderFrame {
  frameId: number;
  timestamp: number;
  commands: RenderCommand[];
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Client-Server Communication Types
 */
export interface ClientConnectedMessage {
  type: 'clientConnected';
  clientId: string;
  capabilities: ClientCapabilities;
}

export interface ClientDisconnectedMessage {
  type: 'clientDisconnected';
  clientId: string;
}

export interface ClientReadyMessage {
  type: 'clientReady';
  clientId: string;
  frameId?: number; // Last frame the client rendered
}

export interface ClientCapabilities {
  supportsWebGL: boolean;
  supportsAudio: boolean;
  maxCanvasSize: { width: number; height: number };
  supportedImageFormats: string[];
  supportedAudioFormats: string[];
}

export interface ServerStatusMessage {
  type: 'serverStatus';
  sceneActive: boolean;
  connectedClients: number;
  currentFrame: number;
}

export type ClientMessage = 
  | ClientConnectedMessage
  | ClientDisconnectedMessage
  | ClientReadyMessage;

export type ServerMessage = 
  | RenderFrame
  | ServerStatusMessage;