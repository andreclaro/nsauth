'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nosskeyService } from '../../services/nosskey.service';
import { relayService } from '../../services/relay.service';
import { useAuthStore } from '../../store/authStore';
import { RelationshipGraph } from '../graph/RelationshipGraph';
import type { ProfileMetadata, FollowEntry } from '../../types/nostr';
import { useZxing } from 'react-zxing';
import './Membership.css';

interface ProfileWithPubkey extends ProfileMetadata {
  pubkey: string;
}

type Props = {
  /** Called when a code is successfully read */
  onDecode: (value: string) => void;
  /** Optional flag to hide the scanner */
  active?: boolean;
};

export const BarcodeScanner = ({ onDecode, active = true }: Props) => {
  const [error, setError] = useState<string | null>(null);
  const { ref } = useZxing({
    onDecodeResult: (result) => {
      // `result.getText()` gives the raw string from the QR/barcode
      onDecode(result.getText());
    },
    onError: (e: unknown) => {
      const errorMessage = e instanceof Error ? e.message : 'Camera error';
      setError(errorMessage);
    },
  });

  // Hide the video element when the scanner isn’t active
  if (!active) return null;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <video
        ref={ref as React.LegacyRef<HTMLVideoElement>}
        style={{ width: '100%', borderRadius: '8px' }}
        playsInline
        muted
      />
      {error && (
        <p style={{ color: 'red', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
    </div>
  );
};

const TrustInfo = () => (
  <section className="trust-info">
    <h2>Building Trust with Verifiable Relationship Credentials</h2>
    <p>
      Beyond the Personhood Credential, members can create <strong>Verifiable Relationship
      Credentials (VRCs)</strong>.  A VRC is issued directly between two members – for example,
      by scanning a QR‑code at a meetup – and certifies a first‑hand trust link.
    </p>
    <p>
      Each VRC becomes a node in a decentralized trust graph.  When you add a member, the
      system records a <strong>role</strong> tag that ties the new
      participant to your existing graph, enabling permissionless access to network‑state
      resources while keeping the underlying data private.
    </p>
    <p>
      The graph grows organically: trusted authorities issue PHCs, and members continuously
      enrich the network with peer‑generated VRCs, creating a resilient, scalable web of
      verified participants.
    </p>
  </section>
);

export function MembershipPage() {
  const router = useRouter();
  const publicKey = useAuthStore((state) => state.publicKey);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<ProfileWithPubkey[]>([]);
  const [members, setMembers] = useState<FollowEntry[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Map<string, ProfileMetadata>>(new Map());
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!publicKey) {
      router.push('/');
      return;
    }

    // Load current follow list
    loadFollowList();
  }, [publicKey, router]);

  useEffect(() => {
    // Load profiles for current members
    if (members.length > 0) {
      loadMemberProfiles();
    }
  }, [members]);

  const handleDecoded = (decoded: string) => {
    // Fill the input field
    setSearchQuery(decoded);
    // Optionally close the scanner UI
    setShowScanner(false);
    // Immediately run the same search logic you already have
    // (you can also wait for the user to press “Search” if you prefer)
    handleSearch(); 
  };

  const loadFollowList = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    try {
      const followList = await relayService.fetchFollowList(publicKey);
      setMembers(followList);
    } catch (error) {
      console.error('Failed to load follow list:', error);
      setSaveMessage('Failed to load membership list');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemberProfiles = async () => {
    if (members.length === 0) return;

    try {
      const pubkeys = members.map((m) => m.pubkey);
      const profilesMap = await relayService.fetchMultipleProfiles(pubkeys);
      setMemberProfiles(profilesMap);
    } catch (error) {
      console.error('Failed to load member profiles:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      // If empty, fetch recent profiles
      setIsLoading(true);
      try {
        const profilesMap = await relayService.queryProfiles([], 50);
        const profilesList: ProfileWithPubkey[] = [];
        profilesMap.forEach((profile, pubkey) => {
          profilesList.push({ ...profile, pubkey });
        });
        setProfiles(profilesList);
      } catch (error) {
        console.error('Failed to query profiles:', error);
        setSaveMessage('Failed to search profiles');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Validate pubkey format (hex string, 64 chars)
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length !== 64 || !/^[0-9a-fA-F]+$/.test(trimmedQuery)) {
      setSaveMessage('Invalid pubkey format. Must be 64 hex characters.');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    try {
      const profilesMap = await relayService.queryProfiles([trimmedQuery], 1);
      const profilesList: ProfileWithPubkey[] = [];
      profilesMap.forEach((profile, pubkey) => {
        profilesList.push({ ...profile, pubkey });
      });
      setProfiles(profilesList);
      if (profilesList.length === 0) {
        setSaveMessage('No profile found for this pubkey');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to query profile:', error);
      setSaveMessage('Failed to search profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (pubkey: string) => {
    if (!publicKey) return;

    // Check if already a member
    if (members.some((m) => m.pubkey === pubkey)) {
      setSaveMessage('User is already a member');
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const newMembers: FollowEntry[] = [
        ...members,
        {
          pubkey,
        },
      ];

      await relayService.publishFollowList(publicKey, newMembers, (event) =>
        nosskeyService.signEvent(event)
      );

      setMembers(newMembers);
      setSaveMessage('Member added successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to add member:', error);
      setSaveMessage(
        error instanceof Error ? `Error: ${error.message}` : 'Failed to add member'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (pubkey: string) => {
    if (!publicKey) return;

    setIsSaving(true);
    try {
      const newMembers = members.filter((m) => m.pubkey !== pubkey);

      await relayService.publishFollowList(publicKey, newMembers, (event) =>
        nosskeyService.signEvent(event)
      );

      setMembers(newMembers);
      setSaveMessage('Member removed successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to remove member:', error);
      setSaveMessage(
        error instanceof Error ? `Error: ${error.message}` : 'Failed to remove member'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getProfileDisplayName = (profile: ProfileMetadata, pubkey: string): string => {
    return profile.display_name || profile.name || pubkey.slice(0, 16) + '...';
  };

  const formatPubkey = (pubkey: string): string => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`;
  };

  if (isLoading && members.length === 0) {
    return (
      <div className="membership-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading membership list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="membership-container">
      <div className="membership-card">
        <h1>Membership Management</h1>
        <TrustInfo />
        <p className="membership-description">
          Query applicants and manage the membership list.
        </p>

        {saveMessage && (
          <div
            className={`save-message ${
              saveMessage.includes('Error') || saveMessage.includes('Failed')
                ? 'error'
                : 'success'
            }`}
          >
            {saveMessage}
          </div>
        )}

        {/* Search Section */}
        <div className="search-section">
          <h2>Add Member</h2>
          <div className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter pubkey or leave empty for recent profiles"
              className="search-input"
              disabled={isLoading}
            />
            <button
              onClick={handleSearch}
              className="search-button"
              disabled={isLoading || isSaving}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => setShowScanner((prev) => !prev)}
              className="scanner-toggle"
              disabled={isLoading || isSaving}
            >
              {showScanner ? 'Close Scanner' : 'Scan QR'}
            </button>
          </div>

          {/* Show the scanner only when the user asked for it */}
          {showScanner && (
            <div style={{ marginTop: '1rem' }}>
              <BarcodeScanner onDecode={handleDecoded} active={true} />
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Point at QR‑code containing a pubkey
              </p>
            </div>
          )}

          {/* Search Results */}
          {profiles.length > 0 && (
            <div className="profiles-list">
              <h3>Search Results</h3>
              {profiles.map((profile) => {
                const isMember = members.some((m) => m.pubkey === profile.pubkey);
                return (
                  <div key={profile.pubkey} className="profile-item">
                    <div className="profile-info">
                      {profile.picture && (
                        <img
                          src={profile.picture}
                          alt={getProfileDisplayName(profile, profile.pubkey)}
                          className="profile-avatar"
                        />
                      )}
                      <div className="profile-details">
                        <div className="profile-name">
                          {getProfileDisplayName(profile, profile.pubkey)}
                        </div>
                        <div className="profile-pubkey">{formatPubkey(profile.pubkey)}</div>
                        {profile.about && (
                          <div className="profile-about">{profile.about}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        isMember
                          ? handleRemoveMember(profile.pubkey)
                          : handleAddMember(profile.pubkey)
                      }
                      className={`member-button ${isMember ? 'remove' : 'add'}`}
                      disabled={isSaving}
                    >
                      {isMember ? 'Remove' : 'Add Member'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members Section */}
        <div className="members-section">
          <h2>Current Members ({members.length})</h2>
          {members.length === 0 ? (
            <p className="empty-message">No members yet. Add members from search results above.</p>
          ) : (
            <div className="members-list">
              {members.map((member) => {
                const profile = memberProfiles.get(member.pubkey);
                return (
                  <div key={member.pubkey} className="member-item">
                    <div className="profile-info">
                      {profile?.picture && (
                        <img
                          src={profile.picture}
                          alt={getProfileDisplayName(profile || {}, member.pubkey)}
                          className="profile-avatar"
                        />
                      )}
                      <div className="profile-details">
                        <div className="profile-name">
                          {profile
                            ? getProfileDisplayName(profile, member.pubkey)
                            : formatPubkey(member.pubkey)}
                        </div>
                        <div className="profile-pubkey">{formatPubkey(member.pubkey)}</div>
                        {profile?.about && (
                          <div className="profile-about">{profile.about}</div>
                        )}
                        {member.petname && (
                          <div className="profile-petname">Name: {member.petname}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.pubkey)}
                      className="member-button remove"
                      disabled={isSaving}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
              <div className="graph-section" style={{ marginTop: '1rem' }}>
                <h2>Your Web Of Trust</h2>
                <p className="graph-intro">
                  Below is a visual representation of the relationships you’ve built with other members.
                </p>

                {/* The graph itself */}
                <RelationshipGraph />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

