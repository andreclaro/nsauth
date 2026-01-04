import { NosskeyManager, type NostrKeyInfo, type NostrEvent, type PasskeyCreationOptions } from 'nosskey-sdk';

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
   * Uses platform authenticator only (Touch ID, Face ID, Windows Hello)
   * to avoid password manager popups like Bitwarden
   * 
   * Note: The SDK always generates a random user.id internally, so we only need to pass
   * user.name and user.displayName. The SDK will handle user.id generation.
   */
  async createPasskey(username?: string): Promise<Uint8Array> {
    const manager = this.getManager();
    
    // Get the current hostname for relying party
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    // Extract the domain without subdomain (e.g., 'nosskey.app' from 'www.nosskey.app' or 'nosskey.app')
    let rpId = hostname === 'localhost' ? 'localhost' : hostname.replace(/^www\./, '');
    // For nosskey.app domain, use 'nosskey.app' as the relying party name
    const rpName = rpId.includes('nosskey.app') ? 'nosskey.app' : rpId;
    // Ensure rpId matches the domain exactly (without port)
    if (rpId.includes('nosskey.app')) {
      rpId = 'nosskey.app';
    }
    
    const trimmedUsername = username?.trim();
    
    // Ensure username is unique to force creation of a new passkey
    // Add timestamp to make it unique if no username provided
    const uniqueUsername = trimmedUsername 
      ? trimmedUsername 
      : `user-${Date.now()}@example.com`;
    
    // The SDK's createPasskey always generates a random user.id internally,
    // so we only need to pass user.name and user.displayName
    // See: https://github.com/ocknamo/nosskey-sdk/blob/bd9e62e2770d4dbf8406a6e6c36b36112329afb8/src/prf-handler.ts#L51
    const options: PasskeyCreationOptions = {
      rp: {
        id: rpId,
        name: rpName,
      },
      user: {
        // Note: SDK ignores user.id and always generates random - see prf-handler.ts line 51
        // Using unique username helps ensure browser creates new passkey instead of reusing existing
        name: uniqueUsername,
        displayName: trimmedUsername || 'User',
      },
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        // Use residentKey (WebAuthn Level 3) instead of requireResidentKey (deprecated)
        // SDK defaults to 'required', but we use 'preferred' for better compatibility
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      // Explicitly request PRF extension - required for deriving Nostr keys
      // The SDK defaults to { prf: {} } but we make it explicit to ensure it's included
      extensions: {
        prf: {},
      },
    };
    
    console.log('[NosskeyService] Creating passkey with options:', {
      rp: options.rp,
      user: {
        name: options.user?.name,
        displayName: options.user?.displayName,
        // Note: user.id will be generated randomly by SDK
      },
      authenticatorSelection: options.authenticatorSelection,
    });
    
    return await manager.createPasskey(options);
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


