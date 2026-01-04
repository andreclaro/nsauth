'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { zkPassportService } from '../../services/zkpassport.service';
import type { VerificationCallbackResult } from '../../types/verification';
import './Verification.css';

export function VerifyOnlyDemo() {
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationCallbackResult | null>(null);
  const [verificationType, setVerificationType] = useState<'age' | 'kyc' | 'personhood' | null>(null);

  const handleStartVerification = async (type: 'age' | 'kyc' | 'personhood') => {
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);
    setVerificationType(type);

    try {
      let result;
      switch (type) {
        case 'age':
          result = await zkPassportService.requestAgeVerification();
          break;
        case 'kyc':
          result = await zkPassportService.requestKYCVerification();
          break;
        case 'personhood':
          result = await zkPassportService.requestPersonhoodVerification();
          break;
      }

      setVerificationUrl(result.url);
      setIsVerifying(true);

      // Set up callback handler
      result.onResult((callbackResult: VerificationCallbackResult) => {
        setIsVerifying(false);
        setIsLoading(false);
        setVerificationResult(callbackResult);

        if (callbackResult.verified) {
          const proof = zkPassportService.processVerificationResult(type, callbackResult);
          console.log('Verification proof:', proof);
        } else {
          setError(`${type} verification failed. Please try again.`);
        }
      });
    } catch (err) {
      console.error(`Failed to start ${type} verification:`, err);
      setError(err instanceof Error ? err.message : 'Failed to start verification');
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    setVerificationUrl(null);
    setVerificationResult(null);
    setError(null);
    setIsVerifying(false);
    setVerificationType(null);
  };

  return (
    <div className="verification-flow" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div className="verification-header">
        <h2>ZKPassport Verification Demo</h2>
        <p className="verification-intro">
          Test ZKPassport verification flows. This is a demo page that doesn't require authentication.
          Scan the QR code with the ZKPassport app to test verification.
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {verificationResult && verificationResult.verified && (
        <div className="verification-status verified" style={{ marginBottom: '1.5rem' }}>
          <span className="status-icon">✓</span>
          <span className="status-text">
            {verificationType} verification successful!
            {verificationResult.uniqueIdentifier && (
              <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Unique ID: {verificationResult.uniqueIdentifier.slice(0, 16)}...
              </span>
            )}
          </span>
        </div>
      )}

      {!verificationUrl ? (
        <div className="verification-options">
          <div className="verification-card">
            <h3>Age Verification</h3>
            <p className="verification-description">
              Verify that you are over 18 years old without revealing your exact age.
            </p>
            <button
              className="verification-button"
              onClick={() => handleStartVerification('age')}
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'Verify Age'}
            </button>
          </div>

          <div className="verification-card">
            <h3>KYC Verification</h3>
            <p className="verification-description">
              Complete KYC verification by disclosing your first name, last name, and nationality.
            </p>
            <button
              className="verification-button"
              onClick={() => handleStartVerification('kyc')}
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'Verify KYC'}
            </button>
          </div>

          <div className="verification-card">
            <h3>Personhood Verification</h3>
            <p className="verification-description">
              Prove that you are a real person from a specific country without revealing any other
              personal information.
            </p>
            <button
              className="verification-button"
              onClick={() => handleStartVerification('personhood')}
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'Verify Personhood'}
            </button>
          </div>
        </div>
      ) : (
        <div className="verification-qr-container">
          <h3 style={{ marginBottom: '1rem' }}>
            {verificationType === 'age' && 'Age Verification'}
            {verificationType === 'kyc' && 'KYC Verification'}
            {verificationType === 'personhood' && 'Personhood Verification'}
          </h3>
          <p className="qr-instructions">
            Scan this QR code with the ZKPassport app to verify:
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
          <button className="cancel-button" onClick={handleReset}>
            {verificationResult ? 'Test Another Verification' : 'Cancel'}
          </button>
        </div>
      )}

      {verificationResult && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginTop: 0 }}>Verification Result (for debugging):</h4>
          <pre style={{ overflow: 'auto', fontSize: '0.875rem' }}>
            {JSON.stringify(verificationResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

