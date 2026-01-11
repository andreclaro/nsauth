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
  "wss://relay.damus.io"
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
  async publishEvent(event: NostrEvent, timeoutMs = 1000): Promise<boolean> {
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
          console.log(event)
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
   * Fetch role tag from profile event (Kind 0)
   */
  async fetchProfileRoleTag(pubkey: string): Promise<string | null> {
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
              const tags = packet.event.tags || [];
              for (const tag of tags) {
                if (tag[0] === 'role' && tag[1]) {
                  resolved = true;
                  subscription.unsubscribe();
                  resolve(tag[1]);
                  return;
                }
              }
              // No role tag found
              resolved = true;
              subscription.unsubscribe();
              resolve(null);
            }
          },
          complete: () => {
            if (!resolved) {
              resolved = true;
              resolve(null);
            }
          },
          error: (error) => {
            console.error('Error fetching profile role tag:', error);
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

  async fetchFollowers(pubkey: string): Promise<FollowEntry[]> {
    return new Promise((resolve) => {
      const req = createRxBackwardReq();
      let resolved = false;

      const subscription = this.rxNostr
        .use(req)
        .pipe(
          uniq(),
          latest(),
          completeOnTimeout(10_000) // same timeout we use for follows
        )
        .subscribe({
          next: (packet) => {
            // We only care about KIND‑3 events that *mention* the target pubkey
            if (packet.event && packet.event.kind === 3 && !resolved) {
              const followers: FollowEntry[] = [];
              const tags = packet.event.tags || [];

              // Each “p” tag is a followed pubkey.  If the tag value equals the
              // target, the *author* of the event is a follower.
              if (packet.event.pubkey) {
                // The author of the KIND‑3 event is the follower.
                const followerPubkey = packet.event.pubkey;

                for (const tag of tags) {
                  if (tag[0] === 'p' && tag[1] === pubkey) {
                    followers.push({
                      pubkey: followerPubkey,
                      relay: tag[2] || undefined,
                      petname: tag[3] || undefined,
                    });
                    // One “p” tag per follower is enough – break to avoid dupes
                    break;
                  }
                }
              }

              // Resolve after processing the first matching event (there may be
              // several events from different relays, but `latest()` already
              // gave us the newest one).
              resolved = true;
              subscription.unsubscribe();
              resolve(followers);
            }
          },
          complete: () => {
            if (!resolved) {
              resolved = true;
              resolve([]); // no follower event seen
            }
          },
          error: (error) => {
            console.error('Error fetching followers:', error);
            if (!resolved) {
              resolved = true;
              resolve([]);
            }
          },
        });

      // NOTE: the filter uses “#p” to match a tag value.
      req.emit([
        {
          kinds: [3],
          '#p': [pubkey], // ← NEW – look for KIND‑3 events that contain this pubkey
          limit: 1,
        },
      ]);
    });
  }

  /**
   * Fetch multiple profiles in batch
   */
  async fetchMultipleProfiles(
    pubkeys: string[],
    timeoutMs = 8000
  ): Promise<Map<string, ProfileMetadata>> {
    // Fast‑path – nothing to fetch
    if (pubkeys.length === 0) {
      return new Map();
    }

    return new Promise<Map<string, ProfileMetadata>>((resolve) => {
      const req = createRxBackwardReq();
      const profiles = new Map<string, ProfileMetadata>();
      let resolved = false;

      // Subscribe **once** – do NOT call .unsubscribe() immediately!
      const subscription = this.rxNostr
        .use(req)
        .pipe(
          // Remove duplicate events (same pubkey/kind)
          uniq(),
          // Emit `complete` if no event arrives within `timeoutMs`
          completeOnTimeout(timeoutMs)
        )
        .subscribe({
          next: (packet) => {
            // We only care about Kind‑0 (profile) events that contain a pubkey
            if (packet.event && packet.event.kind === 0 && packet.event.pubkey) {
              try {
                const meta = JSON.parse(packet.event.content) as ProfileMetadata;
                profiles.set(packet.event.pubkey, meta);
              } catch (e) {
                console.error(
                  `Failed to parse profile metadata for ${packet.event.pubkey}:`,
                  e
                );
              }
            }
          },

          // The observable signals that it’s done (either because the timeout
          // fired or the relay sent a `EOSE`/`CLOSE` frame).  Resolve the promise.
          complete: () => {
            if (!resolved) {
              resolved = true;
              console.info(
                `✅ fetchMultipleProfiles completed – ${profiles.size}/${pubkeys.length} profiles retrieved`
              );
              subscription.unsubscribe(); // clean up
              resolve(profiles);
            }
          },

          error: (err) => {
            if (!resolved) {
              resolved = true;
              console.error('❌ fetchMultipleProfiles error:', err);
              subscription.unsubscribe();
              // Still resolve with whatever we managed to collect (could be empty)
              resolve(profiles);
            }
          },
        });

      // Emit the request to the relays
      req.emit([
        {
          kinds: [0],
          authors: pubkeys,
        },
      ]);

      // Safety net – in the unlikely event the observable never completes
      // (e.g., a buggy relay), enforce our own hard timeout.
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn(
            `⚠️ fetchMultipleProfiles hard timeout (${timeoutMs} ms) – returning ${profiles.size} profiles`
          );
          subscription.unsubscribe();
          resolve(profiles);
        }
      }, timeoutMs + 2000); // a little buffer beyond the Rx timeout
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

  /**
   * Query kind 0 events (profiles) by pubkey
   * If pubkeys array is empty, fetches recent kind 0 events
   */
  async queryProfiles(pubkeys: string[] = [], limit = 100): Promise<Map<string, ProfileMetadata>> {
    return new Promise((resolve) => {
      const req = createRxBackwardReq();
      const profiles = new Map<string, { metadata: ProfileMetadata; timestamp: number }>();
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
                const timestamp = packet.event.created_at || 0;
                // Keep only the latest profile for each pubkey
                const existing = profiles.get(packet.event.pubkey);
                if (!existing || timestamp > existing.timestamp) {
                  profiles.set(packet.event.pubkey, { metadata, timestamp });
                }
              } catch (error) {
                console.error('Failed to parse profile metadata:', error);
              }
            }
          },
          complete: () => {
            if (!resolved) {
              resolved = true;
              // Convert to Map<string, ProfileMetadata>
              const result = new Map<string, ProfileMetadata>();
              profiles.forEach((value, pubkey) => {
                result.set(pubkey, value.metadata);
              });
              resolve(result);
            }
          },
          error: (error) => {
            console.error('Error querying profiles:', error);
            if (!resolved) {
              resolved = true;
              // Convert to Map<string, ProfileMetadata>
              const result = new Map<string, ProfileMetadata>();
              profiles.forEach((value, pubkey) => {
                result.set(pubkey, value.metadata);
              });
              resolve(result);
            }
          },
        })
        .unsubscribe();

      const filter: any = {
        kinds: [0],
        limit,
      };

      if (pubkeys.length > 0) {
        filter.authors = pubkeys;
      }

      req.emit([filter]);
    });
  }

  /**
   * Publish or update a kind 3 event (follow list/contacts)
   */
  async publishFollowList(
    pubkey: string,
    followList: FollowEntry[],
    signEvent: (event: NostrEvent) => Promise<NostrEvent>
  ): Promise<boolean> {
    // Create tags from follow list
    const tags: string[][] = followList.map((entry) => {
      const tag: string[] = ['p', entry.pubkey];
      if (entry.relay) {
        tag.push(entry.relay);
      }
      if (entry.petname) {
        tag.push(entry.petname);
      }
      return tag;
    });

    const event: NostrEvent = {
      kind: 3,
      content: '', // Kind 3 content is typically empty
      created_at: Math.floor(Date.now() / 1000),
      tags,
    };

    // Sign the event
    const signedEvent = await signEvent(event);

    // Publish to relays
    return await this.publishEvent(signedEvent);
  }
}

// Export singleton instance
export const relayService = new RelayService();

