import type { VerificationType } from '../../types/verification';
import './Verification.css';

interface VerificationBadgeProps {
  type: VerificationType;
  verified: boolean;
  onClick?: () => void;
}

export function VerificationBadge({ type, verified, onClick }: VerificationBadgeProps) {
  if (!verified) {
    return null;
  }

  const getBadgeInfo = (type: VerificationType) => {
    switch (type) {
      case 'age':
        return { label: 'Age Verified', icon: '🔞', color: '#10b981' };
      case 'kyc':
        return { label: 'KYC Verified', icon: '✅', color: '#2563eb' };
      case 'personhood':
        return { label: 'Person Verified', icon: '👤', color: '#8b5cf6' };
      default:
        return { label: 'Verified', icon: '✓', color: '#6b7280' };
    }
  };

  const badgeInfo = getBadgeInfo(type);

  return (
    <span
      className={`verification-badge verification-badge-${type}`}
      style={{ backgroundColor: `${badgeInfo.color}20`, color: badgeInfo.color }}
      onClick={onClick}
      title={badgeInfo.label}
    >
      <span className="badge-icon">{badgeInfo.icon}</span>
      <span className="badge-label">{badgeInfo.label}</span>
    </span>
  );
}

