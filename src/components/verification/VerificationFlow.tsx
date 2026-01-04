import { AgeVerification } from './AgeVerification';
import { KYCVerification } from './KYCVerification';
import { PersonhoodVerification } from './PersonhoodVerification';
import './Verification.css';

export function VerificationFlow() {
  return (
    <div className="verification-flow-inline">
      <div className="verification-options">
        <AgeVerification />
        <KYCVerification />
        <PersonhoodVerification />
      </div>
    </div>
  );
}

