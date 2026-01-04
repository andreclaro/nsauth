'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { graphService } from '../../services/graph.service';
import type { GraphData } from '../../types/nostr';
import './Graph.css';

// Workaround for AFRAME error in react-force-graph
if (typeof window !== 'undefined' && !(window as any).AFRAME) {
  (window as any).AFRAME = { components: {}, systems: {}, scenes: [] };
}

export function RelationshipGraph() {
  const publicKey = useAuthStore((state) => state.publicKey);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [ForceGraph2D, setForceGraph2D] = useState<any>(null);
  const graphRef = useRef<any>();

  // Load graph component dynamically
  useEffect(() => {
    import('react-force-graph')
      .then((module) => {
        setForceGraph2D(() => module.ForceGraph2D);
      })
      .catch((err) => {
        console.error('Failed to load graph component:', err);
        setError('Failed to load graph visualization library');
      });
  }, []);

  useEffect(() => {
    if (!publicKey) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    loadGraph();
  }, [publicKey]);

  const loadGraph = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await graphService.buildGraph(publicKey, 2);
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load graph:', err);
      setError(err instanceof Error ? err.message : 'Failed to load relationship graph');
    } finally {
      setIsLoading(false);
    }
  };

  const getNodeColor = (node: any) => {
    // Color based on connection count (hubs get darker colors)
    const connections = node.connections || 0;
    if (connections > 10) return '#1e40af'; // Dark blue for hubs
    if (connections > 5) return '#2563eb'; // Blue
    if (connections > 2) return '#fbbf24'; // Yellow
    return '#ef4444'; // Red for low connectivity
  };

  const getNodeSize = (node: any) => {
    // Larger nodes for hubs
    const connections = node.connections || 0;
    const baseSize = 8;
    const sizeMultiplier = Math.min(Math.sqrt(connections) * 2, 3);
    return baseSize + sizeMultiplier * 4;
  };

  if (isLoading) {
    return (
      <div className="graph-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading relationship graph...</p>
          <p className="loading-hint">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graph-container">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={loadGraph} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="graph-container">
        <div className="empty-state">
          <p>No relationships found.</p>
          <p className="empty-hint">
            Set up your follow list (Kind 3 event) to see your relationship graph.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <div className="graph-header">
        <h1>Relationship Graph</h1>
        <p className="graph-description">
          Visual representation of your Nostr follow network (Web of Trust)
        </p>
        <div className="graph-stats">
          <span>{graphData.nodes.length} nodes</span>
          <span>{graphData.edges.length} connections</span>
        </div>
      </div>

      <div className="graph-wrapper">
        {ForceGraph2D ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeLabel={(node: any) => {
              return `${node.label || node.id.slice(0, 8)}\n${node.pubkey.slice(0, 16)}...`;
            }}
            nodeColor={getNodeColor}
            nodeVal={getNodeSize}
            linkColor={() => 'rgba(0, 0, 0, 0.2)'}
            linkWidth={1}
            onNodeClick={(node: any) => {
              setSelectedNode(node.id === selectedNode ? null : node.id);
            }}
            onNodeHover={(_node: any) => {
              // Cursor will be handled by CSS
            }}
            cooldownTicks={100}
            onEngineStop={() => {
              graphRef.current?.zoomToFit(400, 20);
            }}
          />
        ) : (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading graph visualization...</p>
          </div>
        )}
      </div>

      {selectedNode && (
        <div className="node-details">
          {(() => {
            const node = graphData.nodes.find((n) => n.id === selectedNode);
            if (!node) return null;
            return (
              <>
                <h3>{node.label || node.pubkey.slice(0, 16)}...</h3>
                {node.name && <p className="node-name">{node.name}</p>}
                {node.about && <p className="node-about">{node.about}</p>}
                <p className="node-pubkey">
                  <strong>Pubkey:</strong> {node.pubkey.slice(0, 32)}...
                </p>
                <p className="node-connections">
                  <strong>Connections:</strong> {node.connections || 0}
                </p>
                <button
                  className="close-details"
                  onClick={() => setSelectedNode(null)}
                >
                  Close
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

