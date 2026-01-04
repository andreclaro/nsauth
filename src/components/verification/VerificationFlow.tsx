import { MemberVerification } from './MemberVerification';
import './Verification.css';

export function VerificationFlow() {
  return (
    <div className="verification-flow-inline">
      <div className="verification-options">
        <MemberVerification />
      </div>
    </div>
  );
}

