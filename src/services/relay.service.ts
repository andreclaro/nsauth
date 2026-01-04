import {
  createRxNostr,
  createRxBackwardReq,
  uniq,
  latest,
  completeOnTimeout,
  noopVerifier,
} from 'rx-nostr';
import type { NostrEvent } from '../types/nostr';
import type { ProfileMetadata, FollowEntry } from '../types/nostr';
import type { VerificationProof, VerificationStatus } from '../types/verification';

/**
 * Default Nostr relays
 * Note: WebSocket connections (wss://) don't use CORS, so any CORS errors
 * in the console are likely false positives from internal checks.
 */
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  // Removed relay.nostr.band temporarily due to potential connection issues
];

/**
 * Service for communicating with Nostr relays
 */
class RelayService {
  private rxNostr = createRxNostr({
    verifier: noopVerifier, // Skip signature verification for demo
  });
  private relayUrls: string[] = DEFAULT_RELAYS;

  constructor() {
    this.rxNostr.setDefaultRelays(this.relayUrls);
  }

  /**
   * Set relay URLs
   */
  setRelays(urls: string[]): void {
    this.relayUrls = urls;
    this.rxNostr.setDefaultRelays(urls);
  }

  /**
   * Publish an event to relays
   */
  async publishEvent(event: NostrEvent, timeoutMs = 10000): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.relayUrls.length === 0) {
        reject(new Error('No relays configured'));
        return;
      }

      let successCount = 0;
      let errorCount = 0;
      let resolved = false;

      const subscription = this.rxNostr.send(event).subscribe({
        next: (response) => {
          console.log(`Response from ${response.from}:`, response);

          // Count successful responses
          if (response.type === 'OK') {
            successCount++;
          } else {
            errorCount++;
          }

          // Resolve when all relays have responded
          if (successCount + errorCount >= this.relayUrls.length && !resolved) {
            resolved = true;
            subscription.unsubscribe();
            resolve(successCount > 0);
          }
        },
        error: (error) => {
          console.error('Publish error:', error);
          if (!resolved) {
            resolved = true;
            subscription.unsubscribe();
            reject(error);
          }
        },
      });

      // Timeout after specified duration
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          subscription.unsubscribe();
          // Resolve with success if at least one relay responded
          resolve(successCount > 0);
        }
      }, timeoutMs);
    });
  }

  /**
   * Fetch a profile (Kind 0 event)
   */
  async fetchProfile(pubkey: string): Promise<ProfileMetadata | null> {
    return new Promise((resolve) => {
      const req = createRxBackwardReq();
      let resolved = false;

      const subscription = this.rxNostr
        .use(req)
        .pipe(
          uniq(),
          latest(),
          completeOnTimeout(5000)
        )
        .subscribe({
          next: (packet) => {
            if (packet.event && packet.event.kind === 0 && !resolved) {
              try {
                const metadata = JSON.parse(packet.event.content) as ProfileMetadata;
                resolved = true;
                subscription.unsubscribe();
                resolve(metadata);
              } catch (error) {
                console.error('Failed to parse profile metadata:', error);
              }
            }
          },
          complete: () => {
            if (!resolved) {
              resolved = true;
              resolve(null);
            }
          },
          error: (error) => {
            console.error('Error fetching profile:', error);
            if (!resolved) {
              resolved = true;
              resolve(null);
            }
          },
        });

      req.emit([
        {
          kinds: [0],
          authors: [pubkey],
          limit: 1,
        },
      ]);
    });
  }

  /**
   * Fetch a follow list (Kind 3 event)
   */
  async fetchFollowList(pubkey: string): Promise<FollowEntry[]> {
    return new Promise((resolve) => {
      const req = createRxBackwardReq();
      let resolved = false;

      const subscription = this.rxNostr
        .use(req)
        .pipe(
          uniq(),
          latest(),
          completeOnTimeout(10000)
        )
        .subscribe({
          next: (packet) => {
            if (packet.event && packet.event.kind === 3 && !resolved) {
              const followList: FollowEntry[] = [];
              const tags = packet.event.tags || [];

              for (const tag of tags) {
                if (tag[0] === 'p' && tag[1]) {
                  followList.push({
                    pubkey: tag[1],
                    relay: tag[2] || undefined,
                    petname: tag[3] || undefined,
                  });
                }
              }

              resolved = true;
              subscription.unsubscribe();
              resolve(followList);
            }
          },
          complete: () => {
            if (!resolved) {
              resolved = true;
              resolve([]);
            }
          },
          error: (error) => {
            console.error('Error fetching follow list:', error);
            if (!resolved) {
              resolved = true;
              resolve([]);
            }
          },
        });

      req.emit([
        {
          kinds: [3],
          authors: [pubkey],
          limit: 1,
        },
      ]);
    });
  }

  /**
   * Fetch multiple profiles in batch
   */
  async fetchMultipleProfiles(pubkeys: string[]): Promise<Map<string, ProfileMetadata>> {
    if (pubkeys.length === 0) {
      return new Map();
    }

    return new Promise((resolve) => {
      const req = createRxBackwardReq();
      const profiles = new Map<string, ProfileMetadata>();
      let resolved = false;

      this.rxNostr
        .use(req)
        .pipe(
          uniq(),
          completeOnTimeout(10000)
        )
        .subscribe({
          next: (packet) => {
            if (packet.event && packet.event.kind === 0 && packet.event.pubkey) {
              try {
                const metadata = JSON.parse(packet.event.content) as ProfileMetadata;
                profiles.set(packet.event.pubkey, metadata);
              } catch (error) {
                console.error('Failed to parse profile metadata:', error);
              }
            }
          },
          complete: () => {
            if (!resolved) {
              resolved = true;
              resolve(profiles);
            }
          },
          error: (error) => {
            console.error('Error fetching profiles:', error);
            if (!resolved) {
              resolved = true;
              resolve(profiles);
            }
          },
        })
        .unsubscribe();

      req.emit([
        {
          kinds: [0],
          authors: pubkeys,
        },
      ]);
    });
  }

  /**
   * Publish a verification event (Kind 30001)
   */
  async publishVerificationEvent(
    _pubkey: string,
    proof: VerificationProof,
    signEvent: (event: NostrEvent) => Promise<NostrEvent>
  ): Promise<boolean> {
    const event: NostrEvent = {
      kind: 30001,
      content: JSON.stringify(proof),
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', proof.type], // Verification type tag
        ['d', proof.uniqueIdentifier], // Unique identifier for replaceable events
      ],
    };

    // Sign the event
    const signedEvent = await signEvent(event);

    // Publish to relays
    return await this.publishEvent(signedEvent);
  }

  /**
   * Fetch verification status for a pubkey
   */
  async fetchVerificationStatus(pubkey: string): Promise<VerificationStatus> {
    return new Promise((resolve) => {
      const req = createRxBackwardReq();
      const verifications = new Map<string, VerificationProof>();
      let resolved = false;

      this.rxNostr
        .use(req)
        .pipe(
          uniq(),
          completeOnTimeout(10000)
        )
        .subscribe({
          next: (packet) => {
            if (packet.event && packet.event.kind === 30001) {
              try {
                const proof = JSON.parse(packet.event.content) as VerificationProof;
                // Keep only the latest verification for each type
                const existing = verifications.get(proof.type);
                if (!existing || (proof.timestamp > existing.timestamp)) {
                  verifications.set(proof.type, proof);
                }
              } catch (error) {
                console.error('Failed to parse verification proof:', error);
              }
            }
          },
          complete: () => {
            if (!resolved) {
              resolved = true;
              const status: VerificationStatus = {};
              verifications.forEach((proof) => {
                if (proof.verified) {
                  status[proof.type as keyof VerificationStatus] = proof;
                }
              });
              resolve(status);
            }
          },
          error: (error) => {
            console.error('Error fetching verification status:', error);
            if (!resolved) {
              resolved = true;
              resolve({});
            }
          },
        })
        .unsubscribe();

      req.emit([
        {
          kinds: [30001],
          authors: [pubkey],
        },
      ]);
    });
  }
}

// Export singleton instance
export const relayService = new RelayService();

