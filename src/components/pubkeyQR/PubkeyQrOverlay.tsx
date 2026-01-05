'use client';

import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './Pubkey.module.css';

type Props = {
  /** The public key (hex string) to encode */
  pubkey: string;
  /** Close the overlay */
  onClose: () => void;
};

export const PubkeyQrOverlay = ({ pubkey, onClose }: Props) => {
  // Close on Escape key or click‑outside
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClick = (e: MouseEvent) => {
      // Click outside the inner container closes the overlay
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.inner}`)) onClose();
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.inner}>
        <h2 className={styles.title}>Your Public Key</h2>
        <QRCodeSVG
          value={pubkey}
          size={240}
          level="M"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
        <p className={styles.pubkey}>{pubkey}</p>
        <button onClick={onClose} className={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  );
};