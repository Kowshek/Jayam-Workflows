import type { Role, Status } from '../types';

export const STATUS_TRANSITIONS: Record<Status, Array<{ to: Status; roles: Role[] }>> = {
  Submitted: [
    { to: 'Approved', roles: ['manager'] },
    { to: 'Rejected', roles: ['manager'] },
    { to: 'Needs Clarification', roles: ['manager'] },
  ],
  'Needs Clarification': [{ to: 'Submitted', roles: ['user'] }],
  Approved: [{ to: 'Closed', roles: ['admin'] }],
  Closed: [{ to: 'Reopened', roles: ['admin'] }],
  Reopened: [
    { to: 'Submitted', roles: ['manager', 'admin'] },
    { to: 'Closed', roles: ['admin'] },
  ],
  Rejected: [],
};

export function getAvailableTransitions(currentStatus: Status, role: Role): Status[] {
  return (STATUS_TRANSITIONS[currentStatus] ?? [])
    .filter((t) => t.roles.includes(role))
    .map((t) => t.to);
}

// Status display config
export const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; dot: string }
> = {
  Submitted: {
    label: 'Submitted',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    dot: 'bg-blue-500',
  },
  Approved: {
    label: 'Approved',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    dot: 'bg-emerald-500',
  },
  Rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bg: 'bg-red-50',
    dot: 'bg-red-500',
  },
  'Needs Clarification': {
    label: 'Needs Clarification',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    dot: 'bg-amber-500',
  },
  Closed: {
    label: 'Closed',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    dot: 'bg-slate-400',
  },
  Reopened: {
    label: 'Reopened',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    dot: 'bg-violet-500',
  },
};

export const PRIORITY_CONFIG: Record<
  string,
  { color: string; bg: string }
> = {
  Low:    { color: 'text-slate-600', bg: 'bg-slate-100' },
  Medium: { color: 'text-blue-700',  bg: 'bg-blue-50' },
  High:   { color: 'text-orange-700', bg: 'bg-orange-50' },
  Urgent: { color: 'text-red-700',   bg: 'bg-red-50' },
};

// Action button configs
export const ACTION_CONFIG: Record<
  Status,
  { label: string; btnClass: string; confirmMsg: string }
> = {
  Approved: {
    label: 'Approve',
    btnClass: 'btn-success',
    confirmMsg: 'Are you sure you want to approve this request?',
  },
  Rejected: {
    label: 'Reject',
    btnClass: 'btn-danger',
    confirmMsg: 'Are you sure you want to reject this request?',
  },
  'Needs Clarification': {
    label: 'Request Clarification',
    btnClass: 'btn-warning',
    confirmMsg: 'Request additional information from the submitter?',
  },
  Submitted: {
    label: 'Resubmit',
    btnClass: 'btn-primary',
    confirmMsg: 'Resubmit this request for review?',
  },
  Closed: {
    label: 'Close',
    btnClass: 'btn-secondary',
    confirmMsg: 'Close this request?',
  },
  Reopened: {
    label: 'Reopen',
    btnClass: 'btn-secondary',
    confirmMsg: 'Reopen this request?',
  },
};
