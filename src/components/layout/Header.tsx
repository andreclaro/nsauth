'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { LoginButton } from '../auth/LoginButton';
import { nosskeyService } from '../../services/nosskey.service';
import './Layout.css';

export function Header() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const publicKey = useAuthStore((state) => state.publicKey);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    nosskeyService.clearStoredKeyInfo();
    logout();
    router.push('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link href="/" className="logo">
          <div className="logo-icon-container">
            <svg className="logo-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="logo-text">ns.com</span>
        </Link>

        <nav className="nav">
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="nav-link">
                Profile
              </Link>
              <Link href="/graph" className="nav-link">
                Graph
              </Link>
              <div className="user-info">
                <span className="user-pubkey">
                  {publicKey ? `${publicKey.slice(0, 8)}...` : ''}
                </span>
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link href="/register" className="register-link">
                Register
              </Link>
              <LoginButton />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

