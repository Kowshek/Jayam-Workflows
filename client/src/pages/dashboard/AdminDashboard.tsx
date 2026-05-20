import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from '../../components/ui/StatusBadge';
import PriorityBadge from '../../components/ui/PriorityBadge';
import FilterBar from '../../components/ui/FilterBar';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonTable, SkeletonStats } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import type { RequestFilters } from '../../types';

const STAT_CARDS = [
  { key: 'total',       label: 'Total Requests', icon: '🗂️', color: 'text-slate-700', bg: 'bg-white' },
  { key: 'Submitted',   label: 'Pending',        icon: '⏳', color: 'text-blue-700',  bg: 'bg-blue-50' },
  { key: 'Approved',    label: 'Approved',       icon: '✅', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { key: 'Closed',      label: 'Closed',         icon: '🔒', color: 'text-slate-600',  bg: 'bg-slate-50' },
] as const;

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<RequestFilters>({ page: 1, limit: 10 });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => requestsApi.getStats(),
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests', filters],
    queryFn: () => requestsApi.getAll(filters),
  });

  const stats = statsData?.data?.stats;
  const requests = requestsData?.data?.requests ?? [];
  const pagination = requestsData?.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">All Requests</h1>
        <p className="text-sm text-slate-400 mt-0.5">Full system overview — {user?.name}</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ key, label, icon, color, bg }) => (
            <div key={key} className={`card p-5 ${bg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <span className="text-xl">{icon}</span>
              </div>
              <p className={`text-3xl font-bold ${color}`}>{stats?.[key] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Full status breakdown */}
      {!statsLoading && stats && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Status Breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {(
              [
                ['Submitted', 'bg-blue-500'],
                ['Approved', 'bg-emerald-500'],
                ['Rejected', 'bg-red-500'],
                ['Needs Clarification', 'bg-amber-500'],
                ['Closed', 'bg-slate-400'],
                ['Reopened', 'bg-violet-500'],
              ] as [string, string][]
            ).map(([status, barColor]) => {
              const count = stats[status as keyof typeof stats] as number;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-2 min-w-[140px]">
                  <div className={`w-2.5 h-2.5 rounded-full ${barColor}`} />
                  <span className="text-xs text-slate-500">{status}</span>
                  <span className="text-xs font-semibold text-slate-700 ml-auto">{count}</span>
                  <span className="text-xs text-slate-400">({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      {/* Table */}
      {requestsLoading ? (
        <SkeletonTable />
      ) : requests.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🔍"
            title="No matching requests"
            description="Try adjusting your filters."
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">All Requests</h2>
            <span className="text-xs text-slate-400">{pagination?.total} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Requested by</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-900 truncate max-w-xs">{req.title}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{req.requester_name}</td>
                    <td className="px-4 py-3.5 text-slate-500">{req.category}</td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{formatDate(req.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/requests/${req.id}`}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && (
            <div className="px-5 pb-4 pt-2">
              <Pagination
                pagination={pagination}
                onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
