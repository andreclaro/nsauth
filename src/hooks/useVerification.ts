import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { relayService } from '../services/relay.service';
import { nosskeyService } from '../services/nosskey.service';
import type { VerificationStatus, VerificationProof } from '../types/verification';
import type { NostrEvent } from '../types/nostr';

/**
 * Hook for managing verification state
 */
export function useVerification() {
  const publicKey = useAuthStore((state) => state.publicKey);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load verification status from Nostr events
   */
  const loadVerificationStatus = useCallback(async () => {
    if (!publicKey) {
      setVerificationStatus({});
      return;
    }

    setIsLoading(true);
    try {
      const status = await relayService.fetchVerificationStatus(publicKey);
      setVerificationStatus(status);
    } catch (error) {
      console.error('Failed to load verification status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  /**
   * Add or update a verification proof
   */
  const addVerification = useCallback(
    async (proof: VerificationProof) => {
      if (!publicKey) return;

      try {
        // Update local state
        setVerificationStatus((prev) => ({
          ...prev,
          [proof.type]: proof,
        }));

        // Publish to Nostr
        await relayService.publishVerificationEvent(
          publicKey,
          proof,
          async (event: NostrEvent) => {
            return await nosskeyService.signEvent(event);
          }
        );
      } catch (error) {
        console.error('Failed to save verification:', error);
        throw error;
      }
    },
    [publicKey]
  );

  /**
   * Check if a specific verification type is verified
   */
  const isVerified = useCallback(
    (type: 'age' | 'kyc' | 'personhood'): boolean => {
      return verificationStatus[type]?.verified === true;
    },
    [verificationStatus]
  );

  /**
   * Get verification proof for a type
   */
  const getVerification = useCallback(
    (type: 'age' | 'kyc' | 'personhood'): VerificationProof | undefined => {
      return verificationStatus[type];
    },
    [verificationStatus]
  );

  // Load verification status when public key changes
  useEffect(() => {
    loadVerificationStatus();
  }, [loadVerificationStatus]);

  return {
    verificationStatus,
    isLoading,
    loadVerificationStatus,
    addVerification,
    isVerified,
    getVerification,
  };
}

