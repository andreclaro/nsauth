'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { nosskeyService } from '../../services/nosskey.service';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

export function RegistrationFlow() {
  const router = useRouter();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'info' | 'creating' | 'success'>('info');

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);
    setStep('creating');

    try {
      // Check if PRF is supported
      const isSupported = await nosskeyService.isPrfSupported();
      if (!isSupported) {
        throw new Error(
          'WebAuthn PRF extension is not supported in your browser. Please use Chrome 118+, Safari 17+, or a compatible browser.'
        );
      }

      // Step 1: Create passkey
      // Note: If Bitwarden or another password manager popup appears,
      // you can dismiss it and use your system's native passkey manager instead
      let credentialId: Uint8Array;
      try {
        credentialId = await nosskeyService.createPasskey();
      } catch (passkeyError) {
        // Provide more helpful error message
        const errorMessage = passkeyError instanceof Error ? passkeyError.message : String(passkeyError);
        if (errorMessage.includes('NotAllowedError') || errorMessage.includes('user')) {
          throw new Error(
            'Passkey creation was cancelled or not allowed. Please try again and complete the authentication prompt.'
          );
        } else if (errorMessage.includes('NotSupportedError')) {
          throw new Error(
            'Passkeys are not supported on this device. Please use a device with biometric authentication or a security key.'
          );
        }
        throw new Error(`Failed to create passkey: ${errorMessage}`);
      }

      // Step 2: Create Nostr key from passkey
      const keyInfo = await nosskeyService.createNostrKey(credentialId);

      // Step 3: Set as current key
      nosskeyService.setCurrentKeyInfo(keyInfo);

      // Step 4: Update auth store
      setAuthenticated(keyInfo);

      setStep('success');

      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setStep('info');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-description">
          Create a new account using WebAuthn passkey technology. Your Nostr identity will be securely derived from your passkey.
        </p>

        {step === 'info' && (
          <>
            <div className="auth-features">
              <div className="feature-item">
                <span className="feature-icon">🔐</span>
                <span>Phishing-resistant authentication</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Biometric authentication support</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🌐</span>
                <span>Cross-device synchronization</span>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              className="auth-button primary"
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </>
        )}

        {step === 'creating' && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Creating your passkey...</p>
            <p className="loading-hint">Please follow your browser's authentication prompt</p>
            <p className="loading-hint-small">
              💡 Tip: If Bitwarden or another password manager appears, you can dismiss it and use
              your system's native passkey manager (Touch ID, Face ID, Windows Hello, etc.)
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <p>Account created successfully!</p>
            <p className="success-hint">Redirecting to profile setup...</p>
          </div>
        )}
      </div>
    </div>
  );
}


