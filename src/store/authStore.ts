import { create } from 'zustand';
import type { NostrKeyInfo } from 'nosskey-sdk';

interface AuthState {
  isAuthenticated: boolean;
  publicKey: string | null;
  keyInfo: NostrKeyInfo | null;
  setAuthenticated: (keyInfo: NostrKeyInfo | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  publicKey: null,
  keyInfo: null,
  setAuthenticated: (keyInfo: NostrKeyInfo | null) => {
    set({
      isAuthenticated: !!keyInfo,
      publicKey: keyInfo?.pubkey || null,
      keyInfo,
    });
  },
  logout: () => {
    set({
      isAuthenticated: false,
      publicKey: null,
      keyInfo: null,
    });
  },
}));


