'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nosskeyService } from '../../services/nosskey.service';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

export function LoginButton() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

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

      // Redirect to graph page
      router.push('/graph');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-button-container">
      {error && <div className="error-message small">{error}</div>}
      <button
        className="auth-button secondary"
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
}


