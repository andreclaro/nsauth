import { relayService } from './relay.service';
import type {
  GraphData,
  GraphNode,
  GraphEdge,
  ProfileMetadata,
  FollowEntry,
} from '../types/nostr';

/* -------------------------------------------------------------
   Helper – promise timeout (fails after `ms` milliseconds)
   ------------------------------------------------------------- */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms} ms`)), ms)
  );
  return Promise.race([promise, timeout]) as Promise<T>;
}

/* =============================================================
   GraphService – builds a relationship graph (now includes followers)
   ============================================================= */
class GraphService {
  // ---------- Caches ----------
  private profileCache = new Map<string, ProfileMetadata>();
  private followListCache = new Map<string, FollowEntry[]>();
  private followerListCache = new Map<string, FollowEntry[]>(); // ← NEW

  // ---------- Limits ----------
  private readonly MAX_NODES = 100;   // global node cap
  private readonly MAX_DEPTH = 3;     // maximum recursion depth
  private readonly MAX_FOLLOWS_PER_NODE = 10; // per‑node follow‑list cap
  private readonly MAX_FOLLOWERS_PER_NODE = 10; // ← NEW – keep symmetry

  // ---------- Progress ----------
  private progressCallback?: (processed: number, totalNodes: number) => void;
  setProgressCallback(cb?: (processed: number, totalNodes: number) => void) {
    this.progressCallback = cb;
  }

  // ==========================================================
  // PUBLIC API – buildGraph
  // ==========================================================
  async buildGraph(startPubkey: string, depth: number = this.MAX_DEPTH): Promise<GraphData> {
    const effectiveDepth = Math.min(depth, this.MAX_DEPTH);
    console.log('🔨 buildGraph – startPubkey', startPubkey, '| depth', effectiveDepth);

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const processed = new Set<string>();

    // Seed with the start node (profile may be null)
    const startProfile = await this.getProfile(startPubkey);
    nodes.push(this.createNode(startPubkey, startProfile));

    await withTimeout(
      this.traverseDepth(startPubkey, effectiveDepth, processed, nodes, edges),
      300_000,
      'graph traversal'
    );

    // Compute connection counts (used for node size/color)
    const connCounts = new Map<string, number>();
    for (const e of edges) {
      connCounts.set(e.source, (connCounts.get(e.source) ?? 0) + 1);
      connCounts.set(e.target, (connCounts.get(e.target) ?? 0) + 1);
    }
    for (const n of nodes) {
      n.connections = connCounts.get(n.id) ?? 0;
    }

    console.log('✅ buildGraph completed –', nodes.length, 'nodes,', edges.length, 'edges');
    return { nodes, edges };
  }

  // ==========================================================
  // INTERNAL – depth‑first traversal (parallel per level)
  // ==========================================================
  private async traverseDepth(
    pubkey: string,
    remainingDepth: number,
    processed: Set<string>,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): Promise<void> {
    console.log('↪️ traverseDepth – pubkey', pubkey, '| depth', remainingDepth);

    // ------- STOP CONDITIONS -------
    if (
      remainingDepth === 0 ||
      processed.has(pubkey) ||
      nodes.length >= this.MAX_NODES
    ) {
      console.log('⏹️ stop – depth 0 / already processed / node cap reached');
      return;
    }

    // Mark as processed *before* any async work
    processed.add(pubkey);

    // ---------------------------------------------------------
    // 1️⃣  FETCH OUTGOING follows
    // ---------------------------------------------------------
    let followList: FollowEntry[];
    try {
      followList = await withTimeout(
        this.getFollowList(pubkey),
        100_000,
        `follow list for ${pubkey}`
      );
      console.log('📥 follow list for', pubkey, ':', followList.length);
    } catch (e) {
      console.warn('⚠️ follow list fetch failed – proceeding with empty list', e);
      followList = [];
    }

    // ---------------------------------------------------------
    // 2️⃣  FETCH INCOMING followers (new)
    // ---------------------------------------------------------
    let followerList: FollowEntry[];
    try {
      followerList = await withTimeout(
        this.getFollowerList(pubkey),
        100_000,
        `follower list for ${pubkey}`
      );
      console.log('📥 follower list for', pubkey, ':', followerList.length);
    } catch (e) {
      console.warn('⚠️ follower list fetch failed – proceeding with empty list', e);
      followerList = [];
    }

    // Combine both directions for the rest of the algorithm
    const combined = [
      ...followList.slice(0, this.MAX_FOLLOWS_PER_NODE),
      ...followerList.slice(0, this.MAX_FOLLOWERS_PER_NODE),
    ];

    if (!combined.length) {
      this.reportProgress(processed, nodes);
      return;
    }

    // ---------------------------------------------------------
    // 3️⃣  BULK FETCH PROFILES (same for follows & followers)
    // ---------------------------------------------------------
    const pubkeysToFetch = combined.map((c) => c.pubkey);
    let profilesMap: Map<string, ProfileMetadata>;
    try {
      profilesMap = await withTimeout(
        relayService.fetchMultipleProfiles(pubkeysToFetch, 22_000),
        25_000,
        `profile batch for ${pubkey}`
      );
      console.log(
        `✅ profile batch for ${pubkey} – ${profilesMap.size}/${pubkeysToFetch.length} retrieved`
      );
    } catch (e) {
      console.warn('⚠️ profile batch failed – continuing with whatever we have', e);
      profilesMap = new Map();
    }

    // ---------------------------------------------------------
    // 4️⃣  BUILD NODES & EDGES for THIS LEVEL
    // ---------------------------------------------------------
    const nextLevelPromises: Promise<void>[] = [];

    for (const link of combined) {
      // Global node cap guard
      if (nodes.length >= this.MAX_NODES) break;

      const profile = profilesMap.get(link.pubkey) ?? this.profileCache.get(link.pubkey);

      // Add node if it doesn’t already exist
      if (!nodes.find((n) => n.id === link.pubkey)) {
        nodes.push(this.createNode(link.pubkey, profile ?? null));
      }

      // Determine edge direction:
      //   - If `link` came from the *follow* list → edge: pubkey → link.pubkey
      //   - If `link` came from the *follower* list → edge: link.pubkey → pubkey
      const isFollower = followerList.some((f) => f.pubkey === link.pubkey);
      const source = isFollower ? link.pubkey : pubkey;
      const target = isFollower ? pubkey : link.pubkey;
      edges.push({ source, target });

      // Queue deeper traversal (only if we still have depth left)
      if (remainingDepth > 1 && nodes.length < this.MAX_NODES) {
        console.log('🔁 scheduling deeper traversal for', link.pubkey);
        nextLevelPromises.push(
          this.traverseDepth(
            link.pubkey,
            remainingDepth - 1,
            processed,
            nodes,
            edges
          )
        );
      }
    }

    // ---------------------------------------------------------
    // 5️⃣  REPORT progress
    // ---------------------------------------------------------
    this.reportProgress(processed, nodes);

    // ---------------------------------------------------------
    // 6️⃣  WAIT FOR ALL DEEPER BRANCHES IN PARALLEL
    // ---------------------------------------------------------
    await Promise.all(nextLevelPromises);
  }

  // ----------------------------------------------------------
  // Helper – fire the UI progress callback (if registered)
  // ----------------------------------------------------------
  private reportProgress(processed: Set<string>, nodes: GraphNode[]) {
    if (this.progressCallback) {
      this.progressCallback(processed.size, nodes.length);
    }
  }

  // ==========================================================
  // CACHE‑AWARE helpers (now also cache followers)
  // ==========================================================
  private async getProfile(pubkey: string): Promise<ProfileMetadata | null> {
    if (this.profileCache.has(pubkey)) {
      return this.profileCache.get(pubkey) ?? null;
    }
    try {
      const profile = await relayService.fetchProfile(pubkey);
      if (profile) this.profileCache.set(pubkey, profile);
      return profile ?? null;
    } catch (e) {
      console.warn(`⚠️ fetchProfile failed for ${pubkey}:`, e);
      return null;
    }
  }

  private async getFollowList(pubkey: string): Promise<FollowEntry[]> {
    if (this.followListCache.has(pubkey)) {
      return this.followListCache.get(pubkey) ?? [];
    }
    try {
      const list = await relayService.fetchFollowList(pubkey);
      this.followListCache.set(pubkey, list);
      return list;
    } catch (e) {
      console.warn(`⚠️ fetchFollowList failed for ${pubkey}:`, e);
      return [];
    }
  }

  private async getFollowerList(pubkey: string): Promise<FollowEntry[]> {
    if (this.followerListCache.has(pubkey)) {
      return this.followerListCache.get(pubkey) ?? [];
    }
    try {
      const list = await relayService.fetchFollowers(pubkey);
      this.followerListCache.set(pubkey, list);
      return list;
    } catch (e) {
      console.warn(`⚠️ fetchFollowers failed for ${pubkey}:`, e);
      return [];
    }
  }

  private createNode(pubkey: string, profile: ProfileMetadata | null): GraphNode {
    return {
      id: pubkey,
      label: profile?.name ?? profile?.display_name ?? pubkey.slice(0, 8),
      pubkey,
      name: profile?.name ?? profile?.display_name,
      picture: profile?.picture,
      about: profile?.about,
      connections: 0,
    };
  }

  clearCache(): void {
    this.profileCache.clear();
    this.followListCache.clear();
    this.followerListCache.clear(); // ← NEW
  }
}

/* Export a singleton – the rest of the app imports this instance */
export const graphService = new GraphService();