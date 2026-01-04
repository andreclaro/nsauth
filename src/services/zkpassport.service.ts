import { ZKPassport } from '@zkpassport/sdk';
import type {
  VerificationType,
  VerificationProof,
  VerificationRequestResult,
  VerificationCallbackResult,
} from '../types/verification';

/**
 * Service wrapper around ZKPassport SDK
 * Handles privacy-preserving identity verification
 */
class ZKPassportService {
  private zkPassport: ZKPassport | null = null;

  /**
   * Generate a unique session ID for verification requests
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get backend URL for API calls
   */
  private getBackendUrl(): string {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_BACKEND_URL || window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  }

  /**
   * Initialize ZKPassport SDK
   */
  private getZKPassport(): ZKPassport {
    if (!this.zkPassport) {
      // Determine domain from current host
      const domain =
        typeof window !== 'undefined'
          ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? undefined // Browser environment, domain can be omitted
            : window.location.hostname
          : undefined;

      this.zkPassport = new ZKPassport(domain);
    }
    return this.zkPassport;
  }

  /**
   * Request age verification (prove age >= 18)
   */
  async requestAgeVerification(sessionId?: string): Promise<VerificationRequestResult & { sessionId: string }> {
    const zkPassport = this.getZKPassport();
    const sid = sessionId || this.generateSessionId();
    const backendUrl = this.getBackendUrl();

    const logoUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/vite.svg` : 'https://example.com/logo.svg';

    const queryBuilder = await zkPassport.request({
      name: 'NS Auth',
      logo: logoUrl,
      purpose: 'Verify you are over 18 years old',
      scope: 'age-verification',
    });

    const { url, onResult } = queryBuilder.gte('age', 18).done();

    return {
      sessionId: sid,
      url,
      onResult: (callback: (result: VerificationCallbackResult) => void) => {
        // Set up polling for result from backend
        const pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`${backendUrl}/api/verification/result/${sid}`);
            const data = await response.json();
            
            if (data.found) {
              clearInterval(pollInterval);
              callback(data.result);
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        }, 1000); // Poll every second

        // Cleanup after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 5 * 60 * 1000);

        // Also set up original callback as fallback
        onResult((response) => {
          clearInterval(pollInterval);
          callback({
            verified: response.verified,
            uniqueIdentifier: response.uniqueIdentifier,
            result: response.result,
          });
        });
      },
    };
  }

  /**
   * Request KYC verification
   */
  async requestKYCVerification(sessionId?: string): Promise<VerificationRequestResult & { sessionId: string }> {
    const zkPassport = this.getZKPassport();
    const sid = sessionId || this.generateSessionId();
    const backendUrl = this.getBackendUrl();

    const logoUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/vite.svg` : 'https://example.com/logo.svg';

    const queryBuilder = await zkPassport.request({
      name: 'NS Auth',
      logo: logoUrl,
      purpose: 'Complete KYC verification',
      scope: 'kyc-verification',
    });

    // Request basic identity attributes for KYC
    const { url, onResult } = queryBuilder
      .disclose('firstname' as any)
      .disclose('lastname' as any)
      .disclose('nationality' as any)
      .done();

    return {
      sessionId: sid,
      url,
      onResult: (callback: (result: VerificationCallbackResult) => void) => {
        // Set up polling for result from backend
        const pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`${backendUrl}/api/verification/result/${sid}`);
            const data = await response.json();
            
            if (data.found) {
              clearInterval(pollInterval);
              callback(data.result);
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        }, 1000); // Poll every second

        // Cleanup after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 5 * 60 * 1000);

        // Also set up original callback as fallback
        onResult((response) => {
          clearInterval(pollInterval);
          callback({
            verified: response.verified,
            uniqueIdentifier: response.uniqueIdentifier,
            result: response.result,
          });
        });
      },
    };
  }

  /**
   * Request personhood verification (prove person from country)
   */
  async requestPersonhoodVerification(_country?: string, sessionId?: string): Promise<VerificationRequestResult & { sessionId: string }> {
    const zkPassport = this.getZKPassport();
    const sid = sessionId || this.generateSessionId();
    const backendUrl = this.getBackendUrl();

    const logoUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/vite.svg` : 'https://example.com/logo.svg';

    const queryBuilder = await zkPassport.request({
      name: 'NS Auth',
      logo: logoUrl,
      purpose: 'Prove you are a real person',
      scope: 'personhood-verification',
    });

    const builder = queryBuilder.disclose('nationality' as any);

    const { url, onResult } = builder.done();

    return {
      sessionId: sid,
      url,
      onResult: (callback: (result: VerificationCallbackResult) => void) => {
        // Set up polling for result from backend
        const pollInterval = setInterval(async () => {
          try {
            const response = await fetch(`${backendUrl}/api/verification/result/${sid}`);
            const data = await response.json();
            
            if (data.found) {
              clearInterval(pollInterval);
              callback(data.result);
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        }, 1000); // Poll every second

        // Cleanup after 5 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
        }, 5 * 60 * 1000);

        // Also set up original callback as fallback
        onResult((response) => {
          clearInterval(pollInterval);
          callback({
            verified: response.verified,
            uniqueIdentifier: response.uniqueIdentifier,
            result: response.result,
          });
        });
      },
    };
  }

  /**
   * Process verification callback result
   */
  processVerificationResult(
    type: VerificationType,
    callbackResult: VerificationCallbackResult
  ): VerificationProof | null {
    if (!callbackResult.verified || !callbackResult.uniqueIdentifier) {
      return null;
    }

    const proof: VerificationProof = {
      type,
      verified: true,
      uniqueIdentifier: callbackResult.uniqueIdentifier,
      timestamp: Math.floor(Date.now() / 1000),
      proofData: callbackResult.result,
    };

    // Extract country for personhood verification
    if (type === 'personhood' && callbackResult.result) {
      const result = callbackResult.result as Record<string, { disclose?: { result: string | number } }>;
      if (result.nationality?.disclose?.result) {
        proof.country = String(result.nationality.disclose.result);
      }
    }

    return proof;
  }

  /**
   * Verify a proof (for future use)
   */
  async verifyProof(proof: VerificationProof): Promise<boolean> {
    // ZKPassport proofs are self-verifying through cryptographic proofs
    // This method can be extended to verify proofs against ZKPassport's verification service
    return proof.verified && !!proof.uniqueIdentifier;
  }
}

// Export singleton instance
export const zkPassportService = new ZKPassportService();

