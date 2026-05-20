import { PRIORITY_CONFIG } from '../../lib/workflow';
import type { Priority } from '../../types';

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.Low;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.color}`}>
      {priority}
    </span>
  );
}
