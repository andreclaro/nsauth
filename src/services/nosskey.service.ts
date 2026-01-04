import { NosskeyManager, type NostrKeyInfo, type NostrEvent } from 'nosskey-sdk';

/**
 * Service wrapper around NosskeyManager
 * Handles WebAuthn/Passkey integration with Nostr
 */
class NosskeyService {
  private manager: NosskeyManager | null = null;

  /**
   * Initialize the NosskeyManager instance
   */
  private getManager(): NosskeyManager {
    if (!this.manager) {
      this.manager = new NosskeyManager({
        cacheOptions: {
          enabled: true,
          timeoutMs: 60 * 1000, // 60 seconds
        },
        storageOptions: {
          enabled: true,
          storageKey: 'nsauth_keyinfo',
        },
      });
    }
    return this.manager;
  }

  /**
   * Create a new passkey
   */
  async createPasskey(): Promise<Uint8Array> {
    const manager = this.getManager();
    return await manager.createPasskey();
  }

  /**
   * Create a new Nostr key from a credential ID
   */
  async createNostrKey(credentialId?: Uint8Array): Promise<NostrKeyInfo> {
    const manager = this.getManager();
    return await manager.createNostrKey(credentialId);
  }

  /**
   * Get the current public key
   */
  async getPublicKey(): Promise<string> {
    const manager = this.getManager();
    return await manager.getPublicKey();
  }

  /**
   * Sign a Nostr event
   */
  async signEvent(event: NostrEvent): Promise<NostrEvent> {
    const manager = this.getManager();
    return await manager.signEvent(event);
  }

  /**
   * Get current key info
   */
  getCurrentKeyInfo(): NostrKeyInfo | null {
    const manager = this.getManager();
    return manager.getCurrentKeyInfo();
  }

  /**
   * Set current key info
   */
  setCurrentKeyInfo(keyInfo: NostrKeyInfo): void {
    const manager = this.getManager();
    manager.setCurrentKeyInfo(keyInfo);
  }

  /**
   * Check if key info exists
   */
  hasKeyInfo(): boolean {
    const manager = this.getManager();
    return manager.hasKeyInfo();
  }

  /**
   * Clear stored key info
   */
  clearStoredKeyInfo(): void {
    const manager = this.getManager();
    manager.clearStoredKeyInfo();
  }

  /**
   * Check if PRF is supported
   */
  async isPrfSupported(): Promise<boolean> {
    const { isPrfSupported } = await import('nosskey-sdk');
    return await isPrfSupported();
  }
}

// Export singleton instance
export const nosskeyService = new NosskeyService();


