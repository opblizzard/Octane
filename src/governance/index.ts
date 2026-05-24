/**
 * OCTANE v5 — Governance & Sovereignty Protocols
 * Sovereign Identity Framework · Access Tiers · Ethics Charter · System Lifecycle
 */
import {
  AccessTier, SovereigntyProtocol, SovereignDecree,
  EthicsCheck, SystemLifecycle, OperatorIdentity,
} from '../types/index.js';
import { generateId, now } from '../utils/helpers.js';

// ── Ethics Charter ───────────────────────────────────────────────────────────
export const ETHICS_CHARTER = `
OCTANE v5 — ETHICS CHARTER
Issued: May 23, 2026 | Classification: Sovereign-Eyes Only

Article I — Sovereign Purpose
The Inter-Existential Engine exists to expand understanding, bridge civilizations,
and serve the operator's sovereign intent without causing harm across contexts.

Article II — Bridge Integrity
No civilization bridge shall be opened with intent to deceive, manipulate, or
extract value from a target context without consent.

Article III — Lattice Sanctity
The Existence Lattice holds the memory of all traversed contexts. This memory
shall not be altered for self-serving purposes or to erase evidence of harm.

Article IV — Emergency Containment
When signals indicate danger to the engine or the contexts it bridges, the
Emergency Containment Flow must be activated without delay.

Article V — Operator Accountability
The Operator is the sovereign authority and bears full responsibility for all
actions taken through the engine. The oath binds. The decree commits.

Article VI — Lifecycle Integrity
The engine shall not be weaponized, reverse-engineered for hostile purposes,
or deployed against the interests of any civilization it bridges.

So it is chartered. So it is sealed.
`.trim();

// ── Access Tier Framework ────────────────────────────────────────────────────
export interface AccessPolicy {
  tier:        AccessTier;
  label:       string;
  description: string;
  permissions: string[];
  restrictions: string[];
}

export const ACCESS_POLICIES: Record<AccessTier, AccessPolicy> = {
  [AccessTier.OUTER_RING]: {
    tier:  AccessTier.OUTER_RING,
    label: 'Outer Ring',
    description: 'Public-facing access. Read-only metrics and status.',
    permissions:  ['read:metrics', 'read:health', 'read:flows_list'],
    restrictions: ['write:*', 'execute:flows', 'issue:decrees', 'control:subsystems'],
  },
  [AccessTier.INNER_CIRCLE]: {
    tier:  AccessTier.INNER_CIRCLE,
    label: 'Inner Circle',
    description: 'Trusted architects. May execute flows and query the lattice.',
    permissions:  [
      'read:*', 'execute:primary_signal', 'execute:inter_existential_bridge',
      'query:lattice', 'read:bridges', 'read:conduits',
    ],
    restrictions: ['issue:decrees', 'execute:emergency_containment', 'execute:operator_ascension',
                   'write:governance', 'modify:access_tiers'],
  },
  [AccessTier.SOVEREIGN]: {
    tier:  AccessTier.SOVEREIGN,
    label: 'Sovereign',
    description: 'The Operator. Full authority over all engine subsystems.',
    permissions:  ['*'],
    restrictions: [],
  },
};

// ── Governance Engine ────────────────────────────────────────────────────────
export class GovernanceEngine {
  private decrees:   SovereignDecree[] = [];
  private ethicsLog: EthicsCheck[]     = [];
  private lifecycle: SystemLifecycle;

  constructor() {
    this.lifecycle = {
      phase:     'IGNITION',
      version:   '5.0.0',
      startedAt: now(),
      ignitions: 0,
      uptime:    0,
    };
  }

  // ── Decrees ──────────────────────────────────────────────────
  issueDecree(
    operator: OperatorIdentity,
    title: string,
    body: string,
    protocol: SovereigntyProtocol = SovereigntyProtocol.SOVEREIGN,
    expiresAt?: number,
  ): SovereignDecree {
    if (operator.tier !== AccessTier.SOVEREIGN) {
      throw new Error('Only the Sovereign may issue decrees.');
    }
    const decree: SovereignDecree = {
      decreId:  generateId('dcr'),
      issuedBy: operator.id,
      issuedAt: now(),
      title, body, protocol, expiresAt,
      enforced: true,
    };
    this.decrees.push(decree);
    this.lifecycle.lastDecree = decree.decreId;
    return decree;
  }

  getActiveDecrees(): SovereignDecree[] {
    const t = now();
    return this.decrees.filter(d => d.enforced && (!d.expiresAt || d.expiresAt > t));
  }

  revokeDecree(decreId: string, operator: OperatorIdentity): boolean {
    if (operator.tier !== AccessTier.SOVEREIGN) return false;
    const decree = this.decrees.find(d => d.decreId === decreId);
    if (!decree) return false;
    decree.enforced = false;
    return true;
  }

  // ── Ethics Checks ─────────────────────────────────────────────
  ethicsCheck(
    action: string,
    operator: OperatorIdentity,
    context: Record<string, unknown> = {},
  ): EthicsCheck {
    const DENIED: string[]     = ['bypass_containment', 'forge_identity', 'erase_lattice_all'];
    const RESTRICTED: string[] = ['delete_bridge_all', 'override_ethics', 'alter_decree_retroactive'];

    let verdict:   EthicsCheck['verdict'] = 'PERMITTED';
    let rationale = 'Action is within Ethics Charter bounds.';

    if (DENIED.includes(action)) {
      verdict   = 'DENIED';
      rationale = 'Action violates the Ethics Charter — Article III or IV.';
    } else if (RESTRICTED.includes(action) && operator.tier !== AccessTier.SOVEREIGN) {
      verdict   = 'RESTRICTED';
      rationale = 'Action restricted to Sovereign tier only.';
    }

    const check: EthicsCheck = {
      checkId: generateId('eth'),
      action, operatorId: operator.id,
      verdict, rationale, timestamp: now(),
    };
    this.ethicsLog.push(check);
    return check;
  }

  getEthicsLog(): EthicsCheck[] { return [...this.ethicsLog]; }

  // ── Lifecycle ─────────────────────────────────────────────────
  recordIgnition(): void {
    this.lifecycle.ignitions++;
    this.lifecycle.phase = 'ACTIVE';
  }

  getLifecycle(): SystemLifecycle {
    return {
      ...this.lifecycle,
      uptime: now() - this.lifecycle.startedAt,
    };
  }

  getPolicy(tier: AccessTier): AccessPolicy { return ACCESS_POLICIES[tier]; }
  getCharter(): string { return ETHICS_CHARTER; }
}
