'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { zkPassportService } from '../../services/zkpassport.service';
import { useVerification } from '../../hooks/useVerification';
import type { VerificationCallbackResult } from '../../types/verification';
import './Verification.css';

export function MemberVerification() {
  const { addVerification, isVerified } = useVerification();
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationCallbackResult | null>(null);

  const ageVerified = isVerified('age');
  const kycVerified = isVerified('kyc');
  const memberVerified = ageVerified && kycVerified;

  useEffect(() => {
    if (memberVerified) {
      setVerificationUrl(null);
      setVerificationResult(null);
    }
  }, [memberVerified]);

  /**
   * Normalize name for comparison (lowercase, trim, remove extra spaces)
   */
  const normalizeName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  /**
   * Validate name input against passport data
   */
  const validateName = (): { valid: boolean; error?: string } => {
    if (!verificationResult?.result) {
      return { valid: false, error: 'Verification result not available' };
    }

    try {
      const result = verificationResult.result as Record<string, { disclose?: { result: string | number } }>;
      const passportFirstname = result.firstname?.disclose?.result;
      const passportLastname = result.lastname?.disclose?.result;

      if (!passportFirstname || !passportLastname) {
        return { valid: false, error: 'Passport data not found in verification result' };
      }

      const normalizedPassportFirst = normalizeName(String(passportFirstname));
      const normalizedPassportLast = normalizeName(String(passportLastname));
      const normalizedInputFirst = normalizeName(firstName);
      const normalizedInputLast = normalizeName(lastName);

      if (!normalizedInputFirst || !normalizedInputLast) {
        return { valid: false, error: 'Please enter both first and last name' };
      }

      // Check if names match (allowing for reasonable variations)
      const firstnameMatch = normalizedInputFirst === normalizedPassportFirst || 
                            normalizedInputFirst.includes(normalizedPassportFirst) ||
                            normalizedPassportFirst.includes(normalizedInputFirst);
      const lastnameMatch = normalizedInputLast === normalizedPassportLast ||
                           normalizedInputLast.includes(normalizedPassportLast) ||
                           normalizedPassportLast.includes(normalizedInputLast);

      if (!firstnameMatch || !lastnameMatch) {
        return {
          valid: false,
          error: `Name does not match passport. Expected: ${passportFirstname} ${passportLastname}`,
        };
      }

      return { valid: true };
    } catch (err) {
      return { valid: false, error: 'Failed to validate name' };
    }
  };

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const { url, onResult } = await zkPassportService.requestMemberVerification();
      setVerificationUrl(url);
      setIsVerifying(true);

      // Set up callback handler
      onResult(async (result: VerificationCallbackResult) => {
        setIsVerifying(false);
        setIsLoading(false);
        setVerificationResult(result);

        if (result.verified && result.result) {
          // Extract passport data for name validation
          try {
            const passportData = result.result as Record<string, { disclose?: { result: string | number } }>;
            const passportFirstname = passportData.firstname?.disclose?.result;
            const passportLastname = passportData.lastname?.disclose?.result;

            // Pre-fill the name inputs with passport data
            if (passportFirstname) {
              setFirstName(String(passportFirstname));
            }
            if (passportLastname) {
              setLastName(String(passportLastname));
            }
          } catch (err) {
            console.error('Failed to extract passport data:', err);
          }
        } else {
          setError('Verification failed. Please try again.');
        }
      });
    } catch (err) {
      console.error('Failed to start member verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to start verification');
      setIsLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!verificationResult) return;

    const validation = validateName();
    if (!validation.valid) {
      setError(validation.error || 'Name validation failed');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Process both age and KYC verifications
      const ageProof = zkPassportService.processVerificationResult('age', verificationResult);
      const kycProof = zkPassportService.processVerificationResult('kyc', verificationResult);

      if (ageProof && kycProof) {
        // Add both verifications
        await addVerification(ageProof);
        await addVerification(kycProof);
        setVerificationUrl(null);
        setVerificationResult(null);
        setFirstName('');
        setLastName('');
      } else {
        setError('Failed to process verification results');
      }
    } catch (err) {
      console.error('Failed to confirm verification:', err);
      setError(err instanceof Error ? err.message : 'Failed to confirm verification');
    } finally {
      setIsLoading(false);
    }
  };

  if (memberVerified) {
    return (
      <div className="verification-status verified">
        <span className="status-icon">✓</span>
        <span className="status-text">Member verified (18+ and KYC)</span>
      </div>
    );
  }

  return (
    <div className="verification-card">
      <h3>Member Verification</h3>
      <p className="verification-description">
        Verify that you are over 18 years old and by confirming your name matches your passport.
      </p>

      {error && <div className="error-message">{error}</div>}

      {!verificationUrl ? (
        <button
          className="verification-button"
          onClick={handleStartVerification}
          disabled={isLoading}
        >
          {isLoading ? 'Starting...' : 'Verify Member'}
        </button>
      ) : (
        <div className="verification-qr-container">
          {!verificationResult ? (
            <>
              <p className="qr-instructions">
                Scan this QR code with the ZKPassport app to verify your membership:
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
            </>
          ) : (
            <div className="name-confirmation-section">
              <p className="qr-instructions">
                Verification successful! Please confirm your name matches your passport:
              </p>
              <div className="form-group">
                <label htmlFor="member-firstname">First Name</label>
                <input
                  type="text"
                  id="member-firstname"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="name-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="member-lastname">Last Name</label>
                <input
                  type="text"
                  id="member-lastname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="name-input"
                />
              </div>
              <div className="verification-actions">
                <button
                  className="verification-button"
                  onClick={handleConfirmVerification}
                  disabled={isLoading || !firstName || !lastName}
                >
                  {isLoading ? 'Confirming...' : 'Confirm Verification'}
                </button>
                <button
                  className="cancel-button"
                  onClick={() => {
                    setVerificationUrl(null);
                    setVerificationResult(null);
                    setFirstName('');
                    setLastName('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

