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
import Modal from '../../components/ui/Modal';
import RequestForm from '../../components/request/RequestForm';
import { SkeletonTable, SkeletonStats } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import type { RequestFilters } from '../../types';

const STAT_CARDS = [
  { key: 'total',              label: 'Total',            icon: '📋', color: 'text-slate-700', bg: 'bg-slate-50' },
  { key: 'Submitted',          label: 'Pending Review',   icon: '⏳', color: 'text-blue-700',  bg: 'bg-blue-50' },
  { key: 'Approved',           label: 'Approved',         icon: '✅', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  { key: 'Needs Clarification',label: 'Needs Clarification', icon: '💬', color: 'text-amber-700', bg: 'bg-amber-50' },
] as const;

export default function UserDashboard() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState<RequestFilters>({ page: 1, limit: 10 });
  const [showForm, setShowForm] = useState(false);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => requestsApi.getStats(),
  });

  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ['my-requests', filters],
    queryFn: () => requestsApi.getMyRequests(filters),
  });

  const stats = statsData?.data?.stats;
  const requests = requestsData?.data?.requests ?? [];
  const pagination = requestsData?.data?.pagination;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Requests</h1>
          <p className="text-sm text-slate-400 mt-0.5">Welcome back, {user?.name}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + New Request
        </button>
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
            icon="📋"
            title="No requests yet"
            description="Create your first request and it will show up here."
            action={
              <button onClick={() => setShowForm(true)} className="btn-primary">
                Create Request
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Your Requests</h2>
            <span className="text-xs text-slate-400">{pagination?.total} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Title</th>
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

      {/* New Request Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Request"
        size="lg"
      >
        <RequestForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  );
}
