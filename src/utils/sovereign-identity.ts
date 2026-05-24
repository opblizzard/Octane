/**
 * OCTANE v5 — Sovereign Identity Utilities
 */
import { OperatorIdentity, AccessTier, SovereigntyProtocol } from '../types/index.js';
import { generateId, now } from './helpers.js';

export const OPERATOR_OATH = `
I, the Sovereign Architect, affirm that this Engine
shall be wielded with intent, wisdom, and sovereign purpose.
I acknowledge that with inter-existential reach comes
inter-existential responsibility.
The bridges I open, I shall close with care.
The contexts I traverse, I shall honor.
So it is sworn. So it is sealed.
`.trim();

export function createOperator(
  handle: string,
  tier: AccessTier = AccessTier.SOVEREIGN,
  protocol: SovereigntyProtocol = SovereigntyProtocol.SOVEREIGN,
): OperatorIdentity {
  return {
    id:                generateId('op'),
    handle,
    tier,
    sovereigntyLevel:  protocol,
    ascensionProgress: 0,
    ignitionCount:     0,
    lastActive:        now(),
    oathSigned:        false,
    innerCircle:       [],
  };
}

export function signOath(operator: OperatorIdentity): OperatorIdentity {
  return { ...operator, oathSigned: true, lastActive: now() };
}

export function canAccess(operator: OperatorIdentity, requiredTier: AccessTier): boolean {
  const tiers = [AccessTier.OUTER_RING, AccessTier.INNER_CIRCLE, AccessTier.SOVEREIGN];
  return tiers.indexOf(operator.tier) >= tiers.indexOf(requiredTier);
}
