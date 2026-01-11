'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nosskeyService } from '../../services/nosskey.service';
import { relayService } from '../../services/relay.service';
import { geminiService } from '../../services/gemini.service';
import { useAuthStore } from '../../store/authStore';
import { useVerification } from '../../hooks/useVerification';
import { VerificationFlow } from '../verification/VerificationFlow';
// import { VerificationBadge } from '../verification/VerificationBadge';
import type { ProfileMetadata } from '../../types/nostr';
import './Profile.css';

const PersonhoodInfo = () => (
    <section className="personhood-info">
      <p>
        Network‑state members receive a <strong>Personhood Credential (PHC)</strong> from a trusted authority.
        The PHC attests that the holder is a unique, real individual. Because the credential lives
        in your passport, you can present a <em>zero‑knowledge proof</em> that you are verified.
      </p>
      <p>
        In this form we compare the name you enter with the name disclosed by your verified
        passport proof. If the two match, the profile will be saved as your business card credential together with a
        passport tag that references the PHC’s unique identifier.
      </p>
    </section>
  );

export function ProfilePage() {
  const router = useRouter();
  const publicKey = useAuthStore((state) => state.publicKey);
  const { isVerified, getVerification } = useVerification();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [suggestedRole, setSuggestedRole] = useState<string | null>(null);
  const [isGettingRole, setIsGettingRole] = useState(false);
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
      const [profile, roleTag] = await Promise.all([
        relayService.fetchProfile(publicKey),
        relayService.fetchProfileRoleTag(publicKey),
      ]);
      
      if (profile) {
        setFormData({
          name: profile.name || '',
          display_name: profile.display_name || '',
          about: profile.about || '',
          picture: profile.picture || '',
          website: profile.website || '',
        });
      }
      
      if (roleTag) {
        setSuggestedRole(roleTag);
        console.log('Loaded role tag from profile:', roleTag);
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

      // Suggest role based on "about" field if it has content
      let roleSuggestion: string | null = null;
      if (formData.about && formData.about.trim().length > 0) {
        setIsGettingRole(true);
        try {
          console.log('Calling Gemini API for role suggestion...');
          roleSuggestion = await geminiService.suggestRole(formData.about);
          console.log('Received role suggestion:', roleSuggestion);
          if (roleSuggestion) {
            tags.push(['role', roleSuggestion]);
            setSuggestedRole(roleSuggestion);
            console.log('Role tag set:', roleSuggestion);
          } else {
            setSuggestedRole(null);
            console.log('No role suggestion received');
          }
        } catch (error) {
          // Log error but continue with profile save without role tag
          console.error('Failed to get role suggestion:', error);
          setSuggestedRole(null);
        } finally {
          setIsGettingRole(false);
        }
      } else {
        setSuggestedRole(null);
      }

      const profile = {
        kind: 0,
        content: JSON.stringify(formData),
        created_at: Math.floor(Date.now() / 1000),
        tags,
      };

      const follows = {
        kind: 3,
        content: "",
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["p", publicKey, "wss://relay.damus.io", formData.name || ""],
          ["p", "36732cc35fe56185af1b11160a393d6c73a1fe41ddf1184c10394c28ca5d627b", "wss://relay.damus.io", "Balajis"],
          ["p", "82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2", "wss://relay.damus.io", "Jack"]
        ],
      };

      // Sign event
      const signedProfile = await nosskeyService.signEvent(profile);
      const signedFollows = await nosskeyService.signEvent(follows);


      // Publish to relays
      await relayService.publishEvent(signedProfile);
      await relayService.publishEvent(signedFollows);

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
      router.push('/membership')
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
        <PersonhoodInfo />

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">First Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              placeholder="Your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="display_name">Last Name</label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name || ''}
              onChange={handleChange}
              placeholder="Your Last Name"
            />
          </div>

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
            <label htmlFor="website">LinkedIn</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website || ''}
              onChange={handleChange}
              placeholder="https://linkedin.com/example"
            />
          </div>

          {saveMessage && (
            <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
              {saveMessage}
            </div>
          )}

          {(isGettingRole || suggestedRole) && (
            <div className="role-tag-container">
              {isGettingRole ? (
                <>
                  <div className="role-tag-label">Getting AI suggestion...</div>
                  <div className="role-tag-loading">
                    <div className="role-tag-spinner"></div>
                  </div>
                </>
              ) : suggestedRole ? (
                <>
                  <div className="role-tag-label">AI Suggested Role:</div>
                  <div className="role-tag">
                    {suggestedRole}
                  </div>
                </>
              ) : null}
            </div>
          )}
          
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

          <div className="form-actions">
            <button type="submit" className="save-button" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            {/* <button
              type="button"
              className="cancel-button"
              onClick={() => router.push('/graph')}
            >
              Skip for Now
            </button> */}
          </div>
        </form>

        {/* Verification Section */}
        {/* <div className="verification-section">
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
        </div> */}
      </div>
    </div>
  );
}


