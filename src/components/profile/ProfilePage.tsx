'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nosskeyService } from '../../services/nosskey.service';
import { relayService } from '../../services/relay.service';
import { useAuthStore } from '../../store/authStore';
import { useVerification } from '../../hooks/useVerification';
import { VerificationFlow } from '../verification/VerificationFlow';
import { VerificationBadge } from '../verification/VerificationBadge';
import type { ProfileMetadata } from '../../types/nostr';
import './Profile.css';

export function ProfilePage() {
  const router = useRouter();
  const publicKey = useAuthStore((state) => state.publicKey);
  const { isVerified, getVerification } = useVerification();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [formData, setFormData] = useState<ProfileMetadata>({
    name: '',
    display_name: '',
    about: '',
    picture: '',
    website: '',
  });

  useEffect(() => {
    if (!publicKey) {
      router.push('/');
      return;
    }

    // Load existing profile
    loadProfile();
  }, [publicKey, router]);

  const loadProfile = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const profile = await relayService.fetchProfile(publicKey);
      if (profile) {
        setFormData({
          name: profile.name || '',
          display_name: profile.display_name || '',
          about: profile.about || '',
          picture: profile.picture || '',
          website: profile.website || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Extract passport data from verification proof
   */
  const getPassportData = (): { firstname?: string; lastname?: string } | null => {
    // Check all verification types for passport data
    const verificationTypes: Array<'age' | 'kyc'> = ['age', 'kyc'];
    
    for (const type of verificationTypes) {
      const proof = getVerification(type);
      if (!proof || !proof.proofData) {
        continue;
      }

      try {
        const result = proof.proofData as Record<string, { disclose?: { result: string | number } }>;
        const firstname = result.firstname?.disclose?.result;
        const lastname = result.lastname?.disclose?.result;

        if (firstname && lastname) {
          return {
            firstname: String(firstname).trim(),
            lastname: String(lastname).trim(),
          };
        }
      } catch (error) {
        console.error('Failed to extract passport data:', error);
      }
    }

    return null;
  };

  /**
   * Normalize name for comparison (lowercase, trim, remove extra spaces)
   */
  const normalizeName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  };

  /**
   * Check if profile name matches passport data
   */
  const validateProfileAgainstPassport = (): { valid: boolean; error?: string } => {
    const passportData = getPassportData();
    
    // Only validate if passport data is available
    if (!passportData || !passportData.firstname || !passportData.lastname) {
      return { valid: true }; // Allow submission if passport data is not available
    }

    const normalizedFirstname = normalizeName(passportData.firstname);
    const normalizedLastname = normalizeName(passportData.lastname);
    const passportFullName = normalizeName(`${passportData.firstname} ${passportData.lastname}`);
    
    // Get profile names (use display_name if name is empty, or vice versa)
    const profileName = formData.name ? normalizeName(formData.name) : '';
    const profileDisplayName = formData.display_name ? normalizeName(formData.display_name) : '';
    const primaryProfileName = profileName || profileDisplayName;

    if (!primaryProfileName) {
      return {
        valid: false,
        error: 'Please enter a name or display name that matches your verified identity.',
      };
    }

    // Check if profile name matches passport (allowing for reasonable variations)
    const hasFirstname = primaryProfileName.includes(normalizedFirstname);
    const hasLastname = primaryProfileName.includes(normalizedLastname);
    const exactMatch = primaryProfileName === passportFullName;

    if (!exactMatch && (!hasFirstname || !hasLastname)) {
      return {
        valid: false,
        error: `Profile name must match your verified identity. Expected name containing: ${passportData.firstname} ${passportData.lastname}`,
      };
    }

    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Validate profile data against verified identity before submitting
      const validation = validateProfileAgainstPassport();
      if (!validation.valid) {
        setSaveMessage(validation.error || 'Validation failed');
        setIsSaving(false);
        return;
      }

      // Get uniqueIdentifier from verification proofs (prefer KYC, fallback to age)
      const kycProof = getVerification('kyc');
      const ageProof = getVerification('age');
      const uniqueIdentifier = kycProof?.uniqueIdentifier || ageProof?.uniqueIdentifier;

      // Create Kind 0 event with uniqueIdentifier tag if available
      const tags: string[][] = [];
      if (uniqueIdentifier) {
        tags.push(['passport', uniqueIdentifier]);
      }

      const event = {
        kind: 0,
        content: JSON.stringify(formData),
        created_at: Math.floor(Date.now() / 1000),
        tags,
      };

      // Sign event
      const signedEvent = await nosskeyService.signEvent(event);

      // Publish to relays
      await relayService.publishEvent(signedEvent);

      setSaveMessage('Profile saved successfully!');
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveMessage(
        error instanceof Error ? `Error: ${error.message}` : 'Failed to save profile'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Profile Setup</h1>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Name (like in Passport)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Your username"
            />
          </div>

          {/* <div className="form-group">
            <label htmlFor="display_name">Display Name</label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name || ''}
              onChange={handleChange}
              placeholder="Your display name"
            />
          </div> */}

          <div className="form-group">
            <label htmlFor="about">About</label>
            <textarea
              id="about"
              name="about"
              value={formData.about || ''}
              onChange={handleChange}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="picture">Profile Picture URL</label>
            <input
              type="url"
              id="picture"
              name="picture"
              value={formData.picture || ''}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>

          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
              {saveMessage}
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="save-button" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => router.push('/graph')}
            >
              Skip for Now
            </button>
          </div>
        </form>

        {/* Verification Section */}
        <div className="verification-section">
          <div className="verification-header-section">
            <h2>Identity Verification</h2>
            <div className="verification-badges">
              <VerificationBadge type="age" verified={isVerified('age')} />
              <VerificationBadge type="kyc" verified={isVerified('kyc')} />
            </div>
          </div>

          {!showVerification ? (
            <button
              className="verification-toggle-button"
              onClick={() => setShowVerification(true)}
            >
              {isVerified('age') || isVerified('kyc')
                ? 'Manage Verifications'
                : 'Verify Identity'}
            </button>
          ) : (
            <>
              <button
                className="verification-toggle-button"
                onClick={() => setShowVerification(false)}
              >
                Hide Verification
              </button>
              <VerificationFlow />
            </>
          )}
        </div>
      </div>
    </div>
  );
}


