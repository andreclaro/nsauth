/**
 * Verification proof types
 */
export type VerificationType = 'age' | 'kyc' | 'personhood';

/**
 * Verification proof data structure
 */
export interface VerificationProof {
  type: VerificationType;
  verified: boolean;
  uniqueIdentifier: string;
  timestamp: number;
  proofData?: unknown; // ZKPassport proof data
  country?: string; // For personhood verification
}

/**
 * Verification status for a user
 */
export interface VerificationStatus {
  age?: VerificationProof;
  kyc?: VerificationProof;
  personhood?: VerificationProof;
}

/**
 * ZKPassport verification request result
 */
export interface VerificationRequestResult {
  url: string;
  onResult: (callback: (result: VerificationCallbackResult) => void) => void;
}

/**
 * ZKPassport verification callback result
 */
export interface VerificationCallbackResult {
  verified: boolean;
  uniqueIdentifier: string | undefined;
  result?: unknown; // QueryResult from ZKPassport SDK
}

