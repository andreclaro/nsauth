'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { zkPassportService } from '../../services/zkpassport.service';
import { useVerification } from '../../hooks/useVerification';
import type { VerificationCallbackResult } from '../../types/verification';
import './Verification.css';

export function KYCVerification() {
  const { addVerification, isVerified } = useVerification();
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const verified = isVerified('kyc');

  useEffect(() => {
    if (verified) {
      setVerificationUrl(null);
    }
  }, [verified]);

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { url, onResult } = await zkPassportService.requestKYCVerification();
      setVerificationUrl(url);
      setIsVerifying(true);

      // Set up callback handler
      onResult(async (result: VerificationCallbackResult) => {
        setIsVerifying(false);
        setIsLoading(false);

        if (result.verified) {
          const proof = zkPassportService.processVerificationResult('kyc', result);
          if (proof) {
            await addVerification(proof);
            setVerificationUrl(null);
          }
        } else {
          setError('KYC verification failed. Please try again.');
        }
      });
    } catch (err) {
      console.error('Failed to start KYC verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to start verification');
      setIsLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="verification-status verified">
        <span className="status-icon">✓</span>
        <span className="status-text">KYC verified</span>
      </div>
    );
  }

  return (
    <div className="verification-card">
      <h3>KYC Verification</h3>
      <p className="verification-description">
        Complete Know Your Customer (KYC) verification to meet regulatory requirements while
        protecting your privacy.
      </p>

      {error && <div className="error-message">{error}</div>}

      {!verificationUrl ? (
        <button
          className="verification-button"
          onClick={handleStartVerification}
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Start KYC Verification'}
        </button>
      ) : (
        <div className="verification-qr-container">
          <p className="qr-instructions">
            Scan this QR code with the ZKPassport app to complete KYC verification:
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

