'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { nosskeyService } from '../../services/nosskey.service';
import './Layout.css';
import { useState } from 'react';

export function Header() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const publicKey = useAuthStore((s) => s.publicKey);
  const logout = useAuthStore((s) => s.logout);

  const [menuOpen, setMenuOpen] = useState(false);   // ← new state

  const handleLogout = () => {
    nosskeyService.clearStoredKeyInfo();
    logout();
    router.push('/');
  };

  // close the mobile menu when a link is clicked
  const handleNavClick = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo */}
        <Link href="/" className="logo">
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
              <Link href="/register" className="register-link" onClick={handleNavClick}>
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}