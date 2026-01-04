'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nosskeyService } from '../../services/nosskey.service';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

export function LoginButton() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setLoginError = useAuthStore((state) => state.setLoginError);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    setLoginError(null);

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/e0050ae4-a9d1-45cf-bda1-b00e70e9994b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginButton.tsx:16',message:'handleLogin entry',data:{hasKeyInfo:nosskeyService.hasKeyInfo()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    try {
      // Check if key info exists
      if (!nosskeyService.hasKeyInfo()) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/e0050ae4-a9d1-45cf-bda1-b00e70e9994b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginButton.tsx:22',message:'Throwing error - no account found',data:{errorMessage:'No account found. Please register first.'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/e0050ae4-a9d1-45cf-bda1-b00e70e9994b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginButton.tsx:41',message:'Setting error state',data:{errorMessage,errorType:err instanceof Error ? err.constructor.name : typeof err},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setLoginError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-button-container">
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


