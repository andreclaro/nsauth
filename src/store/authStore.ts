import { create } from 'zustand';
import type { NostrKeyInfo } from 'nosskey-sdk';

interface AuthState {
  isAuthenticated: boolean;
  publicKey: string | null;
  keyInfo: NostrKeyInfo | null;
  loginError: string | null;
  setAuthenticated: (keyInfo: NostrKeyInfo | null) => void;
  setLoginError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  publicKey: null,
  keyInfo: null,
  loginError: null,
  setAuthenticated: (keyInfo: NostrKeyInfo | null) => {
    set({
      isAuthenticated: !!keyInfo,
      publicKey: keyInfo?.pubkey || null,
      keyInfo,
      loginError: null, // Clear error on successful login
    });
  },
  setLoginError: (error: string | null) => {
    set({ loginError: error });
  },
  logout: () => {
    set({
      isAuthenticated: false,
      publicKey: null,
      keyInfo: null,
      loginError: null,
    });
  },
}));


