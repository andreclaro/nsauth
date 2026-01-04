'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { zkPassportService } from '../../services/zkpassport.service';
import { useVerification } from '../../hooks/useVerification';
import type { VerificationCallbackResult } from '../../types/verification';
import './Verification.css';

export function PersonhoodVerification() {
  const { addVerification, isVerified, getVerification } = useVerification();
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verified = isVerified('personhood');
  const verification = getVerification('personhood');

  useEffect(() => {
    if (verified) {
      setVerificationUrl(null);
    }
  }, [verified]);

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { url, onResult } = await zkPassportService.requestPersonhoodVerification();
      setVerificationUrl(url);
      setIsVerifying(true);

      // Set up callback handler
      onResult(async (result: VerificationCallbackResult) => {
        setIsVerifying(false);
        setIsLoading(false);

        if (result.verified) {
          const proof = zkPassportService.processVerificationResult('personhood', result);
          if (proof) {
            await addVerification(proof);
            setVerificationUrl(null);
          }
        } else {
          setError('Personhood verification failed. Please try again.');
        }
      });
    } catch (err) {
      console.error('Failed to start personhood verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to start verification');
      setIsLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="verification-status verified">
        <span className="status-icon">✓</span>
        <span className="status-text">
          Person verified{verification?.country ? ` (${verification.country})` : ''}
        </span>
      </div>
    );
  }

  return (
    <div className="verification-card">
      <h3>Personhood Verification</h3>
      <p className="verification-description">
        Prove that you are a real person from a specific country without revealing any other
        personal information.
      </p>

      {error && <div className="error-message">{error}</div>}

      {!verificationUrl ? (
        <button
          className="verification-button"
          onClick={handleStartVerification}
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Verify Personhood'}
        </button>
      ) : (
        <div className="verification-qr-container">
          <p className="qr-instructions">
            Scan this QR code with the ZKPassport app to verify your personhood:
          </p>
          <div className="qr-code-wrapper">
            <QRCodeSVG value={verificationUrl} size={256} />
          </div>
          <p className="qr-link">
            Or{' '}
            <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
              open in ZKPassport app
            </a>
          </p>
          {isVerifying && (
            <div className="verifying-status">
              <div className="spinner-small"></div>
              <span>Waiting for verification...</span>
            </div>
          )}
          <button
            className="cancel-button"
            onClick={() => {
              setVerificationUrl(null);
              setIsVerifying(false);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

