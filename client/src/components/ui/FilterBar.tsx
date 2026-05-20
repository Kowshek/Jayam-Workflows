import { CATEGORIES } from '../../lib/utils';
import type { RequestFilters, Status, Priority } from '../../types';

const STATUSES: Status[] = [
  'Submitted', 'Approved', 'Rejected', 'Needs Clarification', 'Closed', 'Reopened',
];

interface FilterBarProps {
  filters: RequestFilters;
  onChange: (filters: RequestFilters) => void;
  showStatus?: boolean;
}

export default function FilterBar({ filters, onChange, showStatus = true }: FilterBarProps) {
  const set = (key: keyof RequestFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {showStatus && (
        <select
          className="input !w-auto text-sm"
          value={filters.status ?? ''}
          onChange={(e) => set('status', e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}

      <select
        className="input !w-auto text-sm"
        value={filters.category ?? ''}
        onChange={(e) => set('category', e.target.value)}
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        className="input !w-auto text-sm"
        value={filters.priority ?? ''}
        onChange={(e) => set('priority', e.target.value as Priority)}
      >
        <option value="">All priorities</option>
        {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <input
        type="date"
        className="input !w-auto text-sm"
        value={filters.from ?? ''}
        onChange={(e) => set('from', e.target.value)}
        placeholder="From date"
      />
      <input
        type="date"
        className="input !w-auto text-sm"
        value={filters.to ?? ''}
        onChange={(e) => set('to', e.target.value)}
        placeholder="To date"
      />

      {(filters.status || filters.category || filters.priority || filters.from || filters.to) && (
        <button
          onClick={() => onChange({ page: 1 })}
          className="text-xs text-slate-500 hover:text-red-500 transition-colors"
        >
          ✕ Clear filters
        </button>
      )}
    </div>
  );
}
