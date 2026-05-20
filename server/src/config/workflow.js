/**
 * Workflow State Machine
 * Single source of truth for all allowed transitions.
 * Backend enforces these — frontend uses them for UI hints only.
 */

const STATUS = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_CLARIFICATION: 'Needs Clarification',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
};

const ROLES = {
  USER: 'user',
  MANAGER: 'manager',
  ADMIN: 'admin',
};

/**
 * Transition map: { [fromStatus]: [{ to, allowedRoles }] }
 */
const TRANSITIONS = {
  [STATUS.SUBMITTED]: [
    { to: STATUS.APPROVED, roles: [ROLES.MANAGER] },
    { to: STATUS.REJECTED, roles: [ROLES.MANAGER] },
    { to: STATUS.NEEDS_CLARIFICATION, roles: [ROLES.MANAGER] },
  ],
  [STATUS.NEEDS_CLARIFICATION]: [
    { to: STATUS.SUBMITTED, roles: [ROLES.USER] },
  ],
  [STATUS.APPROVED]: [
    { to: STATUS.CLOSED, roles: [ROLES.ADMIN] },
  ],
  [STATUS.CLOSED]: [
    { to: STATUS.REOPENED, roles: [ROLES.ADMIN] },
  ],
  [STATUS.REOPENED]: [
    { to: STATUS.SUBMITTED, roles: [ROLES.MANAGER, ROLES.ADMIN] },
    { to: STATUS.CLOSED, roles: [ROLES.ADMIN] },
  ],
  [STATUS.REJECTED]: [],
};

/**
 * Validate a status transition for a given role.
 * Returns { valid: true } or { valid: false, reason: string }
 */
function validateTransition(fromStatus, toStatus, role) {
  const allowedTransitions = TRANSITIONS[fromStatus];

  if (!allowedTransitions) {
    return { valid: false, reason: `Unknown current status: ${fromStatus}` };
  }

  const match = allowedTransitions.find((t) => t.to === toStatus);

  if (!match) {
    return {
      valid: false,
      reason: `Transition from '${fromStatus}' to '${toStatus}' is not allowed`,
    };
  }

  if (!match.roles.includes(role)) {
    return {
      valid: false,
      reason: `Your role '${role}' cannot perform this transition`,
    };
  }

  return { valid: true };
}

/**
 * Get what transitions are available for a given status + role
 */
function getAvailableTransitions(currentStatus, role) {
  const transitions = TRANSITIONS[currentStatus] || [];
  return transitions
    .filter((t) => t.roles.includes(role))
    .map((t) => t.to);
}

module.exports = {
  STATUS,
  ROLES,
  TRANSITIONS,
  validateTransition,
  getAvailableTransitions,
};
