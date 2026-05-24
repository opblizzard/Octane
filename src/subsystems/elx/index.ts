/**
 * OCTANE v5 — ELX: Existence Lattice
 * The state mesh that persists across all existential contexts.
 * The ELX remembers what the bridge crossed and what the conduit reached.
 */
import {
  ELXConfig, LatticeNode, LatticeQuery, ELXSnapshot,
  ExistentialLayer,
} from '../../types/index.js';
import { generateId, now, clamp } from '../../utils/helpers.js';

export class ExistenceLattice {
  private config: ELXConfig;
  private nodes: Map<string, LatticeNode> = new Map();
  private snapshots: ELXSnapshot[] = [];
  private coherence: number = 1.0;

  constructor(config: ELXConfig) {
    this.config = config;
  }

  // ── Node Operations ──────────────────────────────────────────

  async write(
    layer: ExistentialLayer,
    contextId: string,
    data: Record<string, unknown>,
    weight = 1.0,
    ttl = 86_400_000,
  ): Promise<LatticeNode> {
    if (this.nodes.size >= this.config.nodeCapacity) {
      this.evict();
    }

    const node: LatticeNode = {
      id:           generateId('node'),
      layer,
      contextId,
      weight:       clamp(weight, 0, 10),
      entangled:    this.config.quantumEntanglement ? this.findEntanglements(layer, contextId) : [],
      data,
      createdAt:    now(),
      lastAccessed: now(),
      ttl,
    };

    this.nodes.set(node.id, node);
    this.coherence = clamp(this.coherence - 0.0001, 0.5, 1.0);
    return node;
  }

  async read(nodeId: string): Promise<LatticeNode | null> {
    const node = this.nodes.get(nodeId);
    if (!node) return null;
    // TTL check
    if (now() - node.createdAt > node.ttl) {
      this.nodes.delete(nodeId);
      return null;
    }
    node.lastAccessed = now();
    return node;
  }

  query(q: LatticeQuery): LatticeNode[] {
    let results = [...this.nodes.values()];
    if (q.layer)     results = results.filter(n => n.layer === q.layer);
    if (q.contextId) results = results.filter(n => n.contextId === q.contextId);
    if (q.minWeight !== undefined) results = results.filter(n => n.weight >= q.minWeight!);
    if (q.entangled) results = results.filter(n => n.entangled.includes(q.entangled!));
    return results
      .sort((a, b) => b.weight - a.weight)
      .slice(q.offset, q.offset + q.limit);
  }

  async delete(nodeId: string): Promise<boolean> {
    return this.nodes.delete(nodeId);
  }

  // ── Entanglement ─────────────────────────────────────────────
  private findEntanglements(layer: ExistentialLayer, contextId: string): string[] {
    return [...this.nodes.values()]
      .filter(n => n.layer === layer || n.contextId === contextId)
      .slice(0, 3)
      .map(n => n.id);
  }

  entangle(nodeIdA: string, nodeIdB: string): boolean {
    const a = this.nodes.get(nodeIdA);
    const b = this.nodes.get(nodeIdB);
    if (!a || !b) return false;
    if (!a.entangled.includes(nodeIdB)) a.entangled.push(nodeIdB);
    if (!b.entangled.includes(nodeIdA)) b.entangled.push(nodeIdA);
    return true;
  }

  // ── Snapshots ────────────────────────────────────────────────
  snapshot(): ELXSnapshot {
    const layers = {} as Record<ExistentialLayer, number>;
    for (const l of Object.values(ExistentialLayer)) layers[l] = 0;
    for (const n of this.nodes.values()) layers[n.layer]++;

    const snap: ELXSnapshot = {
      snapshotId:  generateId('snap'),
      timestamp:   now(),
      nodeCount:   this.nodes.size,
      totalWeight: [...this.nodes.values()].reduce((s, n) => s + n.weight, 0),
      coherence:   this.coherence,
      layers,
    };
    this.snapshots.push(snap);
    if (this.snapshots.length > 100) this.snapshots.shift();
    return snap;
  }

  // ── Eviction ─────────────────────────────────────────────────
  private evict(): void {
    // Evict least-recently-accessed node
    let oldest: LatticeNode | null = null;
    for (const n of this.nodes.values()) {
      if (!oldest || n.lastAccessed < oldest.lastAccessed) oldest = n;
    }
    if (oldest) this.nodes.delete(oldest.id);
  }

  // ── Coherence re-sync ────────────────────────────────────────
  recohere(): void {
    this.coherence = clamp(this.coherence + 0.05, 0, 1);
  }

  getNodeCount():  number         { return this.nodes.size; }
  getCoherence():  number         { return this.coherence; }
  getSnapshots():  ELXSnapshot[]  { return [...this.snapshots]; }
}
