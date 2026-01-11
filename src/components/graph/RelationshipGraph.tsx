'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { useAuthStore } from '../../store/authStore';
import { graphService } from '../../services/graph.service';
import type { GraphData } from '../../types/nostr';
import './Graph.css';

/* -------------------------------------------------------------
   Dynamically load the heavy 3‑D library (SSR disabled)
   ------------------------------------------------------------- */
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading graph visualization…</p>
      </div>
    ),
  }
);

/* -------------------------------------------------------------
   Runtime guard – makes sure the service returns what we expect
   ------------------------------------------------------------- */
function isValidGraph(data: any): data is GraphData {
  return (
    data &&
    Array.isArray(data.nodes) &&
    Array.isArray(data.edges) &&
    data.nodes.every(
      (n: any) => typeof n.id === 'string' && typeof n.pubkey === 'string',
    ) &&
    data.edges.every(
      (e: any) => typeof e.source === 'string' && typeof e.target === 'string',
    )
  );
}

/* -------------------------------------------------------------
   Default SVG (fallback avatar)
   ------------------------------------------------------------- */
const DEFAULT_SVG_DATA_URI =
  'data:image/svg+xml;base64,' +
  btoa(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="skin" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#ffe4c4"/>
      <stop offset="100%" stop-color="#f4b084"/>
    </radialGradient>
  </defs>
  <circle cx="256" cy="256" r="248" fill="#f8fafc"/>
  <circle cx="256" cy="180" r="80" fill="url(#skin)"/>
  <ellipse cx="256" cy="400" rx="120" ry="60" fill="#e2e8f0"/>
  <circle cx="224" cy="160" r="16" fill="#374151"/>
  <circle cx="288" cy="160" r="16" fill="#374151"/>
  <path d="M240 230 Q256 250 272 230" stroke="#374151" stroke-width="8" stroke-linecap="round" fill="none"/>
</svg>`);

/* ============================================================
   RelationshipGraph – rebuilt for proper sizing & centering
   ============================================================ */
export function RelationshipGraph() {
  /* -------------------------- State -------------------------- */
  const publicKey = useAuthStore((s) => s.publicKey);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const graphRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* -------------------- Canvas size handling -------------------- */
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
    w: 800,
    h: 600,
  });

  // Keep canvas size in sync with the wrapper element
  useEffect(() => {
    if (!wrapperRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.round(width), h: Math.round(height) });
        // Re‑fit after resize
        if (graphRef.current) {
          graphRef.current.zoomToFit(400, 50);
        }
      }
    });
    ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  /* -------------------- Progress callback -------------------- */
  const progressCallback = useCallback(
    (processed: number, totalNodes: number) => {
      setProgressMsg(`Processed ${processed} pubkeys → ${totalNodes} nodes built`);
    },
    [],
  );

  useEffect(() => {
    graphService.setProgressCallback?.(progressCallback);
    return () => {
      graphService.setProgressCallback?.(undefined);
    };
  }, [progressCallback]);

  /* ----------------------- Load graph ----------------------- */
  useEffect(() => {
    if (!publicKey) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }
    loadGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]);

  /* -------------------- Timeout fallback (30 s) -------------------- */
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setError('Loading is taking longer than expected. Please try again later.');
      setIsLoading(false);
    }, 300_000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const loadGraph = async () => {
    if (!publicKey) return;
    setIsLoading(true);
    setError(null);
    setProgressMsg(null);
    try {
      const data = await graphService.buildGraph(publicKey, 4);
      if (!isValidGraph(data)) throw new Error('Malformed graph data received');
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
    } finally {
      setIsLoading(false);
      setProgressMsg(null);
    }
  };

  /* -------------------- Texture helpers -------------------- */
  const textureLoader = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    return loader;
  }, []);

  const makeCircularTexture = (
    img: HTMLImageElement,
    diameter: number,
    maxAniso: number,
  ): THREE.Texture => {
    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelDiameter = diameter * dpr;
    canvas.width = canvas.height = pixelDiameter;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    // Clip to perfect circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(diameter / 2, diameter / 2, diameter / 2 - 0.5, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw image centred
    const ratio = Math.min(diameter / img.naturalWidth, diameter / img.naturalHeight);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    const x = (diameter - w) / 2;
    const y = (diameter - h) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    // Optional glow (kept from original)
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = pixelDiameter;
    const glowCtx = glowCanvas.getContext('2d')!;
    glowCtx.filter =
      'drop-shadow(0px 0px 12px rgba(255,255,255,0.6)) drop-shadow(0px 0px 24px rgba(0,0,0,0.1))';
    glowCtx.drawImage(canvas, 0, 0);

    const tex = new THREE.CanvasTexture(glowCanvas);
    tex.generateMipmaps = true;
    tex.minFilter = THREE.LinearMipMapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = Math.min(maxAniso, 16);
    tex.needsUpdate = true;
    return tex;
  };

  const loadDefaultSvgTexture = (
    diameter: number,
    maxAniso: number,
  ): Promise<THREE.Texture> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = DEFAULT_SVG_DATA_URI;
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(makeCircularTexture(img, diameter, maxAniso));
      img.onerror = reject;
    });
  };

  /* -------------------- Avatar sprite creator -------------------- */
  const createAvatarSprite = (
    pictureUrl: string | undefined,
    size: number,
    maxAniso: number,
  ) => {
    // Size now depends on canvas width – ensures proportionality
    const baseDiameter = Math.max(Math.round(canvasSize.w / 30), 30);
    const diameter = Math.max(size * baseDiameter, 30);

    const material = new THREE.SpriteMaterial({
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(diameter * 0.85, diameter * 0.85, 1);

    const applyTex = (tex: THREE.Texture) => {
      material.map = tex;
      material.needsUpdate = true;
    };

    const fallback = async () => {
      try {
        const tex = await loadDefaultSvgTexture(diameter, maxAniso);
        applyTex(tex);
      } catch (e) {
        console.error('Fallback SVG failed', e);
      }
    };

    if (pictureUrl) {
      textureLoader.load(
        pictureUrl,
        (tex) => {
          const img = tex.image as HTMLImageElement;
          applyTex(makeCircularTexture(img, diameter, maxAniso));
        },
        undefined,
        fallback,
      );
    } else {
      fallback();
    }

    return sprite;
  };

  /* -------------------- Node colour helper -------------------- */
  const getNodeColor = (node: any) => {
    const c = node.connections ?? 0;
    if (c > 20) return '#1e40af';
    if (c > 12) return '#2563eb';
    if (c > 6) return '#fbbf24';
    if (c > 2) return '#f59e0b';
    return '#ef4444';
  };

  /* -------------------- Auto‑fit after data load -------------------- */
  useLayoutEffect(() => {
    if (graphRef.current && graphData) {
      // Give the graph a moment to render before fitting
      setTimeout(() => graphRef.current.zoomToFit(400, 50), 0);
    }
  }, [graphData]);

  /* --------------------------- UI --------------------------- */
  if (isLoading) {
    return (
      <div className="graph-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading relationship graph…</p>
          {progressMsg && <p className="loading-progress">{progressMsg}</p>}
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
            Add members to your member list and the graph will appear here.
          </p>
        </div>
      </div>
    );
  }

  /* ------------------- Main graph UI ------------------- */
  return (
    <div className={`graph-container${selectedNode ? ' has-selected-node' : ''}`}>
      {/* Wrapper that drives the canvas size */}
      <div className="graph-wrapper" ref={wrapperRef}>
        <ForceGraph3D
          ref={graphRef}
          width={canvasSize.w}
          height={canvasSize.h}
          graphData={{
            nodes: graphData.nodes,
            links: graphData.edges.map((e) => ({
              source: e.source,
              target: e.target,
            })),
          }}

          /* ----------- Custom avatar sprite (scaled) ----------- */
          nodeThreeObject={(node: any) => {
            const maxAniso =
              (graphRef.current?.renderer?.capabilities?.getMaxAnisotropy?.() ??
                16) as number;
            // `size` is just a multiplier; real pixel size comes from canvas width
            return createAvatarSprite(node.picture, 1, maxAniso);
          }}

          /* ----------- Tooltip & styling ----------- */
          nodeLabel={(node: any) =>
            `${node.label || node.id.slice(0, 8)} · ${node.pubkey.slice(0, 16)}…`
          }
          nodeColor={getNodeColor}
          nodeVal={1}

          rendererConfig={{
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
          }}
          backgroundColor="#f8fafc"
          linkColor={() => 'rgba(0,0,0,0.8)'}
          linkWidth={1}
          linkOpacity={0.9}

          onNodeClick={(node: any) =>
            setSelectedNode(node.id === selectedNode ? null : node.id)
          }
        />
      </div>

      {/* Selected node details panel */}
      {selectedNode && (
        <div className="node-details">
          {(() => {
            const node = graphData.nodes.find((n) => n.id === selectedNode);
            if (!node) return null;
            return (
              <>
                <h3>{node.label || node.pubkey.slice(0, 16)}…</h3>
                {node.name && <p className="node-name">{node.name}</p>}
                {node.about && <p className="node-about">{node.about}</p>}
                <p className="node-pubkey">
                  <strong>Pubkey:</strong> {node.pubkey.slice(0, 32)}…
                </p>
                <p className="node-connections">
                  <strong>Connections:</strong> {node.connections ?? 0}
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