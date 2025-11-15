/**
 * Network Monitor
 *
 * Monitors network connectivity and notifies listeners of changes
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkStatusListener = (isConnected: boolean) => void;

class NetworkMonitor {
  private isConnected: boolean = true;
  private listeners: Set<NetworkStatusListener> = new Set();
  private unsubscribe: (() => void) | null = null;

  /**
   * Initialize network monitoring
   */
  initialize() {
    this.unsubscribe = NetInfo.addEventListener(this.handleConnectivityChange);
  }

  /**
   * Clean up network monitoring
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Handle connectivity changes
   */
  private handleConnectivityChange = (state: NetInfoState) => {
    const wasConnected = this.isConnected;
    this.isConnected = state.isConnected ?? false;

    // Only notify if status changed
    if (wasConnected !== this.isConnected) {
      console.log('[NetworkMonitor] Connection status changed:', this.isConnected);
      this.notifyListeners();
    }
  };

  /**
   * Get current connection status
   */
  async getConnectionStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isConnected = state.isConnected ?? false;
    return this.isConnected;
  }

  /**
   * Check if currently connected
   */
  isNetworkConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Add listener for network status changes
   */
  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of network status change
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isConnected);
      } catch (error) {
        console.error('[NetworkMonitor] Listener error:', error);
      }
    });
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();
