// frontend/src/services/socketService.ts
import { io, type Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  connect(): void {
    try {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to WebSocket server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from WebSocket server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
    }
  }

  // Subscribe to blockchain updates
  subscribeToBlockchain(callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized');
      return;
    }

    this.socket.on('blockchain:update', callback);
    this.socket.on('blockchain:newBlock', callback);
  }

  // Subscribe to specific product
  subscribeToProduct(productId: string): void {
    if (!this.socket) {
      console.warn('⚠️ Socket not initialized');
      return;
    }

    this.socket.emit('subscribe:product', productId);
    console.log(`📦 Subscribed to product: ${productId}`);
  }

  // Unsubscribe from product
  unsubscribeFromProduct(productId: string): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('unsubscribe:product', productId);
    console.log(`📦 Unsubscribed from product: ${productId}`);
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Disconnect
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();