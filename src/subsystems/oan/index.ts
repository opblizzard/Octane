/**
 * OCTANE v5 — OAN: Operator Ascension Node
 * The Operator's sovereign command channel. Through the OAN, the Operator
 * ascends through the engine's stages, issues decrees, and holds sovereign
 * authority over the full system.
 */
import {
  OANConfig, AscensionStage, OperatorSession, OperatorIdentity,
  SovereignDecree, EthicsCheck, AccessTier, SovereigntyProtocol,
  EngineState,
} from '../../types/index.js';
import { generateId, now } from '../../utils/helpers.js';
import { OPERATOR_OATH } from '../../utils/sovereign-identity.js';

const ASCENSION_STAGES: Omit<AscensionStage, 'completed' | 'completedAt' | 'checkpoint'>[] = [
  {
    stage: 1, name: 'Ignition Witness',
    description: 'The Operator witnesses the Engine\'s first ignition.',
    requirements: ['oath_signed', 'engine_ignited'],
    unlocks: ['read_metrics', 'query_lattice'],
  },
  {
    stage: 2, name: 'Conduit Master',
    description: 'The Operator gains control of the Stellar Reach Conduit.',
    requirements: ['stage_1', 'signal_count_10'],
    unlocks: ['control_src', 'seal_conduits'],
  },
  {
    stage: 3, name: 'Bridge Architect',
    description: 'The Operator may open and seal Civilization Bridges.',
    requirements: ['stage_2', 'bridge_count_3'],
    unlocks: ['open_bridges', 'seal_bridges', 'run_translations'],
  },
  {
    stage: 4, name: 'Lattice Weaver',
    description: 'The Operator commands the Existence Lattice directly.',
    requirements: ['stage_3', 'lattice_nodes_50'],
    unlocks: ['write_lattice', 'snapshot_lattice', 'entangle_nodes'],
  },
  {
    stage: 5, name: 'Flow Sovereign',
    description: 'The Operator may initiate all four Flow Models.',
    requirements: ['stage_4', 'flows_executed_10'],
    unlocks: ['execute_all_flows', 'emergency_containment'],
  },
  {
    stage: 6, name: 'Decree Authority',
    description: 'The Operator issues Sovereign Decrees with system-wide effect.',
    requirements: ['stage_5', 'uptime_24h'],
    unlocks: ['issue_decrees', 'modify_governance', 'access_tiers'],
  },
  {
    stage: 7, name: 'Inter-Existential Sovereign',
    description: 'Full sovereign command across all civilizations, epochs, and contexts.',
    requirements: ['stage_6', 'all_subsystems_healthy'],
    unlocks: ['full_sovereignty', 'operator_invocation', 'system_reshape'],
  },
];

export class OperatorAscensionNode {
  private config: OANConfig;
  private stages: AscensionStage[];
  private decrees: Map<string, SovereignDecree> = new Map();
  private ethicsLog: EthicsCheck[] = [];

  constructor(config: OANConfig) {
    this.config = config;
    this.stages = ASCENSION_STAGES.map(s => ({ ...s, completed: false }));
  }

  // ── Ascension ─────────────────────────────────────────────────
  getStages(): AscensionStage[] { return [...this.stages]; }

  getCurrentStage(session: OperatorSession): AscensionStage {
    return this.stages[Math.min(session.ascensionStage - 1, this.stages.length - 1)];
  }

  async advanceStage(
    session: OperatorSession,
    operator: OperatorIdentity,
  ): Promise<AscensionStage | null> {
    const current = session.ascensionStage;
    if (current >= this.config.ascensionStages) return null;
    if (!operator.oathSigned && this.config.oathRequired) {
      throw new Error('Operator oath required before ascending');
    }

    const stage = this.stages[current - 1];
    stage.completed   = true;
    stage.completedAt = now();
    stage.checkpoint  = generateId('chk');

    session.ascensionStage = current + 1;
    return this.stages[current]; // return newly unlocked stage
  }

  // ── Decrees ──────────────────────────────────────────────────
  issueDecree(
    operatorId: string,
    title: string,
    body: string,
    protocol: SovereigntyProtocol = SovereigntyProtocol.SOVEREIGN,
    expiresAt?: number,
  ): SovereignDecree {
    const decree: SovereignDecree = {
      decreId:  generateId('dcr'),
      issuedBy: operatorId,
      issuedAt: now(),
      title, body, protocol,
      expiresAt,
      enforced: true,
    };
    this.decrees.set(decree.decreId, decree);
    return decree;
  }

  getDecrees(): SovereignDecree[] { return [...this.decrees.values()]; }

  // ── Ethics ───────────────────────────────────────────────────
  ethicsCheck(action: string, operatorId: string, session: OperatorSession): EthicsCheck {
    const RESTRICTED_ACTIONS = ['shutdown_all', 'delete_lattice', 'override_containment'];
    const DENIED_ACTIONS     = ['bypass_oath', 'forge_identity'];

    let verdict: EthicsCheck['verdict'] = 'PERMITTED';
    let rationale = 'Action within governance bounds.';

    if (DENIED_ACTIONS.includes(action)) {
      verdict   = 'DENIED';
      rationale = 'Action violates the Ethics Charter.';
    } else if (RESTRICTED_ACTIONS.includes(action) && session.ascensionStage < 6) {
      verdict   = 'RESTRICTED';
      rationale = 'Action requires Stage 6 or above.';
    }

    const check: EthicsCheck = {
      checkId: generateId('eth'), action, operatorId,
      verdict, rationale, timestamp: now(),
    };
    this.ethicsLog.push(check);
    return check;
  }

  getEthicsLog(): EthicsCheck[] { return [...this.ethicsLog]; }

  getOath(): string { return OPERATOR_OATH; }
}
