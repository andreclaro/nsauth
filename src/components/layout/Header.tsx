'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from 'ns-auth-sdk';
import { useNSAuth } from '@/providers/NSAuthProvider';
import './Layout.css';
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';   // <-- import directly

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { authService } = useNSAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const publicKey = useAuthStore((s) => s.publicKey);
  const logout = useAuthStore((s) => s.logout);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setLoginError = useAuthStore((s) => s.setLoginError);
  const [showQr, setShowQr] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Ref to the button that opens the QR panel – used for click‑outside detection
  const qrButtonRef = useRef<HTMLButtonElement>(null);
  const qrPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowQr(false);
    };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      // If the click is NOT inside the button OR the panel, close it
      if (
        qrButtonRef.current?.contains(target) ||
        qrPanelRef.current?.contains(target)
      ) {
        return;
      }
      setShowQr(false);
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handleClick);
    };
  }, []);

  useEffect(() => {
    setHasAccount(authService.hasKeyInfo());
  }, [pathname, authService]);

  const handleLogout = () => {
    authService.clearStoredKeyInfo();
    logout();
    setHasAccount(false);
    router.push('/');
  };

  const handleLogin = async () => {
    setIsLoginLoading(true);
    setLoginError(null);
    setMenuOpen(false);
    try {
      if (!authService.hasKeyInfo())
        throw new Error('No account found. Please register first.');

      const keyInfo = authService.getCurrentKeyInfo();
      if (!keyInfo) throw new Error('Failed to load account information.');

      await authService.getPublicKey(); // triggers WebAuthn
      setAuthenticated(keyInfo);
      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to login';
      setLoginError(msg);
      setIsLoginLoading(false);
    }
  };

  return (
    <header className="header" style={{ position: 'relative' }}>
      <div className="header-content">
        {/* LOGO */}
        <Link href="/" className="logo">
          <img
            src="/network-state-plus-flag-logo.png"
            alt="Network School"
            className="logo-image"
          />
        </Link>

        {/* HAMBURGER (mobile) */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>

        {/* NAVIGATION */}
        <nav className={`nav ${menuOpen ? 'mobile-open' : ''}`}>
          <Link href="/docs" className="nav-link" onClick={() => setMenuOpen(false)}>
            Docs
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>
                Profile
              </Link>
              <Link href="/membership" className="nav-link" onClick={() => setMenuOpen(false)}>
                Membership
              </Link>

              <div className="user-info" style={{ position: 'relative' }}>
                {/* PUBLIC‑KEY BUTTON – opens the inline QR panel */}
                <button
                  ref={qrButtonRef}
                  className="user-pubkey btn-pubkey"
                  onClick={() => setShowQr((prev) => !prev)}
                  title="Show QR code for your public key"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer',
                    color: 'inherit',
                    fontFamily: 'inherit',
                  }}
                >
                  {publicKey ? `${publicKey.slice(0, 12)}…` : ''}
                </button>

                {/* INLINE QR PANEL (visible only when showQr===true) */}
                {showQr && publicKey && (
                  <div
                    ref={qrPanelRef}
                    className="qr-panel"
                    role="dialog"
                    aria-modal="true"
                  >
                    <QRCodeSVG
                      value={publicKey}
                      size={180}
                      level="M"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                )}

                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              {hasAccount ? (
                <button
                  onClick={handleLogin}
                  disabled={isLoginLoading}
                  className="login-link"
                >
                  {isLoginLoading ? 'Logging in...' : 'Login'}
                </button>
              ) : (
                <Link href="/register" className="register-link" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}