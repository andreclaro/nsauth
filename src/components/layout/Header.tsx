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
          <img src="/ns-com-logo.png" alt="Network School" className="logo-image" />
        </Link>

        <nav className="nav">
          <Link href="/docs" className="nav-link">
            Docs
          </Link>
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

