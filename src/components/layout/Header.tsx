'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { nosskeyService } from '../../services/nosskey.service';
import './Layout.css';
import { useState, useEffect } from 'react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const publicKey = useAuthStore((s) => s.publicKey);
  const logout = useAuthStore((s) => s.logout);
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const setLoginError = useAuthStore((s) => s.setLoginError);

  const [menuOpen, setMenuOpen] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Check if user has an account (key info stored)
  // Update when pathname changes so it reflects after registration
  useEffect(() => {
    setHasAccount(nosskeyService.hasKeyInfo());
  }, [pathname]);

  const handleLogout = () => {
    nosskeyService.clearStoredKeyInfo();
    logout();
    setHasAccount(false);
    router.push('/');
  };

  const handleLogin = async () => {
    setIsLoginLoading(true);
    setLoginError(null);
    setMenuOpen(false); // Close mobile menu

    try {
      // Check if key info exists
      if (!nosskeyService.hasKeyInfo()) {
        throw new Error('No account found. Please register first.');
      }

      // Get current key info
      const keyInfo = nosskeyService.getCurrentKeyInfo();
      if (!keyInfo) {
        throw new Error('Failed to load account information.');
      }

      // Verify by getting public key (this will trigger WebAuthn authentication)
      await nosskeyService.getPublicKey();

      // Set as authenticated
      setAuthenticated(keyInfo);

      // Redirect to docs page
      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setLoginError(errorMessage);
      setIsLoginLoading(false);
    }
  };

  // close the mobile menu when a link is clicked
  const handleNavClick = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo */}
        <Link href="/docs" className="logo">
          <img
            src="/network-state-plus-flag-logo.png"
            alt="Network School"
            className="logo-image"
          />
        </Link>

        {/* Hamburger – only visible on small screens */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>

        {/* Navigation – the “mobile‑open” class is added when the menu is open */}
        <nav className={`nav ${menuOpen ? 'mobile-open' : ''}`}>
          <Link href="/docs" className="nav-link" onClick={handleNavClick}>
            Docs
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/profile" className="nav-link" onClick={handleNavClick}>
                Profile
              </Link>
              <Link href="/membership" className="nav-link" onClick={handleNavClick}>
                Membership
              </Link>

              <div className="user-info">
                <span className="user-pubkey">
                  {publicKey ? `${publicKey.slice(0, 8)}…` : ''}
                </span>
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
                <Link href="/register" className="register-link" onClick={handleNavClick}>
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