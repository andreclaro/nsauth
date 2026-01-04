/**
 * Nostr event types
 */
export interface NostrEvent {
  id?: string;
  pubkey?: string;
  created_at?: number;
  kind: number;
  tags?: string[][];
  content: string;
  sig?: string;
}

import type { VerificationStatus } from './verification';

/**
 * Profile metadata (Kind 0)
 */
export interface ProfileMetadata {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  website?: string;
  verification?: VerificationStatus;
  [key: string]: unknown;
}

/**
 * Follow list entry (from Kind 3 tags)
 */
export interface FollowEntry {
  pubkey: string;
  relay?: string;
  petname?: string;
}

/**
 * Graph node data
 */
export interface GraphNode {
  id: string;
  label: string;
  pubkey: string;
  name?: string;
  picture?: string;
  about?: string;
  connections?: number;
}

/**
 * Graph edge data
 */
export interface GraphEdge {
  source: string;
  target: string;
}

/**
 * Graph data structure
 */
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}


