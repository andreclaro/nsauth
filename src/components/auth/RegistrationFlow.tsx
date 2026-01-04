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
  const [username, setUsername] = useState('');

  console.log('[RegistrationFlow] Component rendered', { step, isLoading, username, error });

  const handleRegister = async () => {
    console.log('[RegistrationFlow] handleRegister called', { username });
    setIsLoading(true);
    setError(null);
    setStep('creating');

    try {
      // Clear any existing stored key info before creating a new passkey
      // This ensures we're creating a new account, not trying to sign in
      console.log('[RegistrationFlow] Clearing any existing stored credentials...');
      nosskeyService.clearStoredKeyInfo();

      // Skip PRF support check during registration to avoid triggering sign-in flow
      // The createPasskey call will fail with a clear error if PRF isn't supported
      // This ensures we get "passkeySavePrompt" notification instead of "passkeySigningIn"

      // Step 1: Create passkey
      // Uses platform authenticator only (Touch ID, Face ID, Windows Hello)
      // to skip password managers like Bitwarden
      // This will trigger "passkeySavePrompt" notification
      let credentialId: Uint8Array;
      const passkeyUsername = username.trim() || undefined;
      console.log('[RegistrationFlow] Creating passkey (this should trigger passkeySavePrompt)...', { username: passkeyUsername });
      try {
        credentialId = await nosskeyService.createPasskey(passkeyUsername);
        console.log('[RegistrationFlow] Passkey created successfully', { 
          credentialIdLength: credentialId.length,
          credentialIdHex: Array.from(credentialId).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32) + '...'
        });
      } catch (passkeyError) {
        console.error('[RegistrationFlow] Passkey creation failed:', passkeyError);
        // Provide more helpful error message
        const errorMessage = passkeyError instanceof Error ? passkeyError.message : String(passkeyError);
        console.error('[RegistrationFlow] Passkey error details:', { 
          errorMessage, 
          errorType: passkeyError instanceof Error ? passkeyError.constructor.name : typeof passkeyError,
          errorStack: passkeyError instanceof Error ? passkeyError.stack : undefined
        });
        if (errorMessage.includes('NotAllowedError') || errorMessage.includes('user')) {
          throw new Error(
            'Passkey creation was cancelled or not allowed. Please try again and complete the authentication prompt.'
          );
        } else if (errorMessage.includes('NotSupportedError') || errorMessage.includes('PRF')) {
          throw new Error(
            'WebAuthn PRF extension is not supported in your browser. Please use Chrome 118+, Safari 17+, or a compatible browser.'
          );
        }
        throw new Error(`Failed to create passkey: ${errorMessage}`);
      }

      // Step 2: Create Nostr key from passkey
      // This requires PRF extension support - if it fails, the browser may not support PRF
      console.log('[RegistrationFlow] Creating Nostr key from passkey...');
      let keyInfo;
      try {
        keyInfo = await nosskeyService.createNostrKey(credentialId);
        console.log('[RegistrationFlow] Nostr key created', { 
          pubkey: keyInfo.pubkey,
          pubkeyLength: keyInfo.pubkey.length
        });
      } catch (nostrKeyError) {
        console.error('[RegistrationFlow] Failed to create Nostr key from passkey:', nostrKeyError);
        const errorMessage = nostrKeyError instanceof Error ? nostrKeyError.message : String(nostrKeyError);
        if (errorMessage.includes('PRF secret not available') || errorMessage.includes('PRF')) {
          throw new Error(
            'PRF extension is required but not available. This may mean:\n' +
            '1. Your browser doesn\'t support WebAuthn PRF extension (Chrome 118+, Safari 17+)\n' +
            '2. The passkey was created without PRF support\n' +
            'Please try again or use a compatible browser.'
          );
        }
        throw nostrKeyError;
      }

      // Step 3: Set as current key
      console.log('[RegistrationFlow] Setting current key info...');
      nosskeyService.setCurrentKeyInfo(keyInfo);

      // Step 4: Update auth store
      console.log('[RegistrationFlow] Updating auth store...');
      setAuthenticated(keyInfo);
      console.log('[RegistrationFlow] Auth store updated');

      setStep('success');
      console.log('[RegistrationFlow] Registration successful, redirecting...');

      // Redirect to profile page after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err) {
      console.error('[RegistrationFlow] Registration error:', err);
      console.error('[RegistrationFlow] Error details:', {
        error: err,
        errorType: err instanceof Error ? err.constructor.name : typeof err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setStep('info');
      setIsLoading(false);
      console.log('[RegistrationFlow] Error handled, reset to info step');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        <p className="auth-description">
          Create a new decentralized Identity. Your identity will be securely derived from a passkey.
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

            <div className="username-section">
              <label htmlFor="username" className="username-label">
                Name (Optional)
              </label>
              <input
                id="username"
                type="text"
                className="username-input"
                placeholder="Enter a name for this passkey"
                value={username}
                onChange={(e) => {
                const newUsername = e.target.value;
                console.log('[RegistrationFlow] Username changed:', newUsername);
                setUsername(newUsername);
              }}
                disabled={isLoading}
              />
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
              💡 Using your system's native passkey manager (Touch ID, Face ID, Windows Hello, etc.)
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
