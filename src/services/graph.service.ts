import { relayService } from './relay.service';
import type { GraphData, GraphNode, GraphEdge } from '../types/nostr';
import type { ProfileMetadata, FollowEntry } from '../types/nostr';

/**
 * Service for building relationship graph data
 */
class GraphService {
  private profileCache = new Map<string, ProfileMetadata>();
  private followListCache = new Map<string, FollowEntry[]>();

  /**
   * Build graph data from a starting pubkey
   */
  async buildGraph(startPubkey: string, depth: number = 2): Promise<GraphData> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const processed = new Set<string>();

    // Fetch initial profile
    const startProfile = await this.getProfile(startPubkey);
    nodes.push(this.createNode(startPubkey, startProfile));

    // Build graph recursively
    await this.buildGraphRecursive(startPubkey, depth, processed, nodes, edges);

    // Calculate connections for node sizing
    const connectionCounts = new Map<string, number>();
    for (const edge of edges) {
      connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
      connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
    }

    // Update nodes with connection counts
    for (const node of nodes) {
      node.connections = connectionCounts.get(node.id) || 0;
    }

    return { nodes, edges };
  }

  /**
   * Recursively build graph
   */
  private async buildGraphRecursive(
    pubkey: string,
    depth: number,
    processed: Set<string>,
    nodes: GraphNode[],
    edges: GraphEdge[]
  ): Promise<void> {
    if (depth === 0 || processed.has(pubkey)) {
      return;
    }

    processed.add(pubkey);

    // Fetch follow list
    const followList = await this.getFollowList(pubkey);

    // Fetch profiles for all followed users
    const pubkeys = followList.map((f) => f.pubkey);
    const profiles = await relayService.fetchMultipleProfiles(pubkeys);

    // Add nodes and edges
    for (const follow of followList) {
      const profile = profiles.get(follow.pubkey) || this.profileCache.get(follow.pubkey);

      // Add node if not exists
      if (!nodes.find((n) => n.id === follow.pubkey)) {
        nodes.push(this.createNode(follow.pubkey, profile ?? null));
      }

      // Add edge
      edges.push({
        source: pubkey,
        target: follow.pubkey,
      });

      // Recursively process if depth allows
      if (depth > 1) {
        await this.buildGraphRecursive(follow.pubkey, depth - 1, processed, nodes, edges);
      }
    }
  }

  /**
   * Get profile with caching
   */
  private async getProfile(pubkey: string): Promise<ProfileMetadata | null> {
    if (this.profileCache.has(pubkey)) {
      return this.profileCache.get(pubkey) || null;
    }

    const profile = await relayService.fetchProfile(pubkey);
    if (profile) {
      this.profileCache.set(pubkey, profile);
    }

    return profile;
  }

  /**
   * Get follow list with caching
   */
  private async getFollowList(pubkey: string): Promise<FollowEntry[]> {
    if (this.followListCache.has(pubkey)) {
      return this.followListCache.get(pubkey) || [];
    }

    const followList = await relayService.fetchFollowList(pubkey);
    this.followListCache.set(pubkey, followList);

    return followList;
  }

  /**
   * Create a graph node from pubkey and profile
   */
  private createNode(pubkey: string, profile: ProfileMetadata | null): GraphNode {
    return {
      id: pubkey,
      label: profile?.name || profile?.display_name || pubkey.slice(0, 8),
      pubkey,
      name: profile?.name || profile?.display_name,
      picture: profile?.picture,
      about: profile?.about,
      connections: 0,
    };
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.profileCache.clear();
    this.followListCache.clear();
  }
}

// Export singleton instance
export const graphService = new GraphService();


