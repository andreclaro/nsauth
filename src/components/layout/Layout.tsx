'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Header } from './Header';
import { useAuthStore } from '../../store/authStore';
import { LoginButton } from '../auth/LoginButton';
import { nosskeyService } from '../../services/nosskey.service';
import '../auth/Auth.css';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const loginError = useAuthStore((state) => state.loginError);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [hasRegistered, setHasRegistered] = useState(false);

  useEffect(() => {
    // Check if user has registered (has key info stored)
    const checkRegistration = () => {
      setHasRegistered(nosskeyService.hasKeyInfo());
    };

    // Check on mount and when authentication status changes
    checkRegistration();

    // Listen for storage changes (in case user registers in another tab/window)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkRegistration);
      return () => {
        window.removeEventListener('storage', checkRegistration);
      };
    }
  }, [isAuthenticated]);

  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {loginError && (
          <div className="error-message small">
            {loginError}
          </div>
        )}
        {hasRegistered && !isAuthenticated && (
          <div className="login-button-container">
            <LoginButton />
          </div>
        )}
        {children}
      </main>
    </div>
  );
}


