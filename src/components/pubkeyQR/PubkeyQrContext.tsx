// src/contexts/QrContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { PubkeyQrOverlay } from '@/components/pubkeyQR/PubkeyQrOverlay';
import { useAuthStore } from '@/store/authStore';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type QrContextType = {
  open: () => void;
  close: () => void;
};

// ------------------------------------------------------------------
// Context definition
// ------------------------------------------------------------------
const QrContext = createContext<QrContextType | undefined>(undefined);

// ------------------------------------------------------------------
// Provider component – wrap your whole app with this
// ------------------------------------------------------------------
export const QrProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [show, setShow] = useState(false);
  const publicKey = useAuthStore((s) => s.publicKey);

  const open = () => setShow(true);
  const close = () => setShow(false);

  return (
    <QrContext.Provider value={{ open, close }}>
      {children}
      {/* The overlay lives here so it appears above everything else */}
      {show && publicKey && (
        <PubkeyQrOverlay pubkey={publicKey} onClose={close} />
      )}
    </QrContext.Provider>
  );
};

// ------------------------------------------------------------------
// Hook for consumers
// ------------------------------------------------------------------
export const useQr = (): QrContextType => {
  const ctx = useContext(QrContext);
  if (!ctx) {
    throw new Error('useQr must be used within QrProvider');
  }
  return ctx;
};