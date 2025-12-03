import WebSocket from 'ws';
import { EventEmitter } from 'events';

/**
 * Gemini 3 Live API Client
 * Real-time multimodal interaction via WebSocket
 */

interface GeminiLiveConfig {
  apiKey: string;
  model?: string;
  thinkingLevel?: 'low' | 'medium' | 'high';
  mediaResolution?: 'low' | 'medium' | 'high';
  vadEnabled?: boolean;
  interruptionThreshold?: number;
  searchGrounding?: boolean;
}

interface StreamMessage {
  type: 'text' | 'audio' | 'video' | 'function_call';
  data: any;
  timestamp?: number;
  sessionId?: string;
}

export class GeminiLiveClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: Required<GeminiLiveConfig>;
  private sessionId: string | null = null;
  private isConnected: boolean = false;
  private messageQueue: StreamMessage[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor(config: GeminiLiveConfig) {
    super();

    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-3.0-live',
      thinkingLevel: config.thinkingLevel || 'medium',
      mediaResolution: config.mediaResolution || 'medium',
      vadEnabled: config.vadEnabled !== false,
      interruptionThreshold: config.interruptionThreshold || 0.5,
      searchGrounding: config.searchGrounding || false,
    };
  }

  /**
   * Connect to Gemini Live WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:streamGenerateContent?key=${this.config.apiKey}`;

      this.ws = new WebSocket(wsUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.ws.on('open', () => {
        console.log('✅ Connected to Gemini Live API');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.sendConfiguration();
        this.processQueue();
        resolve();
      });

      this.ws.on('message', (data: Buffer) => {
        this.handleMessage(data);
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
        if (!this.isConnected) {
          reject(error);
        }
      });

      this.ws.on('close', (code, reason) => {
        console.log(`🔌 Disconnected: ${code} - ${reason}`);
        this.isConnected = false;
        this.emit('disconnect', { code, reason });
        this.attemptReconnect();
      });

      // Timeout connection after 10 seconds
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Send initial configuration to the server
   */
  private sendConfiguration(): void {
    if (!this.ws || !this.isConnected) return;

    const config = {
      type: 'configure',
      config: {
        thinking_level: this.config.thinkingLevel,
        media_resolution: this.config.mediaResolution,
        vad_config: {
          enabled: this.config.vadEnabled,
          interruption_threshold: this.config.interruptionThreshold,
        },
        tools: {
          search_grounding: this.config.searchGrounding,
          code_execution: true,
          function_calling: true,
        },
      },
    };

    this.ws.send(JSON.stringify(config));
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());

      // Extract session ID
      if (message.sessionId && !this.sessionId) {
        this.sessionId = message.sessionId;
        this.emit('session', this.sessionId);
      }

      // Handle different message types
      switch (message.type) {
        case 'text':
          this.emit('text', message.content);
          break;

        case 'audio':
          // Audio data is base64 encoded PCM
          const audioBuffer = Buffer.from(message.content, 'base64');
          this.emit('audio', audioBuffer);
          break;

        case 'function_call':
          this.emit('function_call', {
            name: message.function_name,
            arguments: message.arguments,
          });
          break;

        case 'thinking':
          // Deep think mode progress
          this.emit('thinking', message.content);
          break;

        case 'error':
          this.emit('error', new Error(message.content));
          break;

        case 'chunk':
          // Streaming chunk
          this.emit('chunk', message);
          break;

        default:
          this.emit('message', message);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
      this.emit('error', error);
    }
  }

  /**
   * Send text message
   */
  async sendText(text: string): Promise<void> {
    const message: StreamMessage = {
      type: 'text',
      data: text,
      timestamp: Date.now(),
      sessionId: this.sessionId || undefined,
    };

    return this.sendMessage(message);
  }

  /**
   * Stream video frames
   */
  async streamVideo(frameBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<void> {
    const message: StreamMessage = {
      type: 'video',
      data: {
        mimeType,
        data: frameBuffer.toString('base64'),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId || undefined,
    };

    return this.sendMessage(message);
  }

  /**
   * Stream audio data
   */
  async streamAudio(audioBuffer: Buffer, sampleRate: number = 16000): Promise<void> {
    const message: StreamMessage = {
      type: 'audio',
      data: {
        sampleRate,
        data: audioBuffer.toString('base64'),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId || undefined,
    };

    return this.sendMessage(message);
  }

  /**
   * Call a function/tool
   */
  async callFunction(name: string, args: any): Promise<void> {
    const message: StreamMessage = {
      type: 'function_call',
      data: {
        name,
        arguments: args,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId || undefined,
    };

    return this.sendMessage(message);
  }

  /**
   * Send message with queue support
   */
  private async sendMessage(message: StreamMessage): Promise<void> {
    if (!this.isConnected || !this.ws) {
      // Queue message if not connected
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
      this.emit('sent', message);
    } catch (error) {
      console.error('Failed to send message:', error);
      this.messageQueue.push(message);
      throw error;
    }
  }

  /**
   * Process queued messages
   */
  private processQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message).catch(console.error);
      }
    }
  }

  /**
   * Interrupt current response
   */
  interrupt(): void {
    if (!this.ws || !this.isConnected) return;

    this.ws.send(JSON.stringify({
      type: 'interrupt',
      timestamp: Date.now(),
    }));
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max_reconnect_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(async () => {
      try {
        await this.connect();
        console.log('Reconnection successful');
        this.emit('reconnect');
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, delay);
  }

  /**
   * Disconnect from the WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.isConnected = false;
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
    this.messageQueue = [];
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check connection status
   */
  isActive(): boolean {
    return this.isConnected;
  }
}

// Example usage
async function example() {
  const client = new GeminiLiveClient({
    apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
    model: 'gemini-3.0-live',
    thinkingLevel: 'high',
    mediaResolution: 'medium',
  });

  // Set up event listeners
  client.on('text', (text) => {
    console.log('Gemini says:', text);
  });

  client.on('audio', (audioBuffer) => {
    // Play audio response
    console.log('Received audio:', audioBuffer.length, 'bytes');
  });

  client.on('thinking', (progress) => {
    console.log('Thinking...', progress);
  });

  client.on('function_call', ({ name, arguments: args }) => {
    console.log('Function call:', name, args);
    // Execute function and send result back
  });

  // Connect and interact
  await client.connect();
  await client.sendText("Hello! Can you see and hear me?");

  // Stream video frame
  // const frame = await captureScreenshot();
  // await client.streamVideo(frame);

  // Stream audio
  // const audio = await recordAudio();
  // await client.streamAudio(audio);

  // Interrupt if needed
  // client.interrupt();

  // Disconnect when done
  // client.disconnect();
}

export default GeminiLiveClient;