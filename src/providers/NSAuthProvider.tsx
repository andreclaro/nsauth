'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { AuthService, RelayService, useAuthStore, useAuthInit } from 'ns-auth-sdk';
import { EventStore } from 'applesauce-core';

interface NSAuthContextValue {
  authService: AuthService;
  relayService: RelayService;
}

const NSAuthContext = createContext<NSAuthContextValue | null>(null);

interface NSAuthProviderProps {
  children: ReactNode;
  relayUrls?: string[];
}

export function NSAuthProvider({ children, relayUrls = ['wss://relay.damus.io'] }: NSAuthProviderProps) {
  const authService = useMemo(() => new AuthService({
    rpId: typeof window !== 'undefined' ? window.location.hostname.replace(/^www\./, '') : 'localhost',
    storageKey: 'nsauth_keyinfo',
  }), []);

  const eventStore = useMemo(() => {
    return new EventStore();
  }, []);

  const relayService = useMemo(() => {
    const service = new RelayService({ relayUrls });
    service.initialize(eventStore);
    return service;
  }, [eventStore, relayUrls]);

  // Initialize auth on mount
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  useAuthInit(authService, setAuthenticated);

  return (
    <NSAuthContext.Provider value={{ authService, relayService }}>
      {children}
    </NSAuthContext.Provider>
  );
}

export function useNSAuth() {
  const context = useContext(NSAuthContext);
  if (!context) {
    throw new Error('useNSAuth must be used within NSAuthProvider');
  }
  return context;
}

