import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import StatusBadge from '../components/ui/StatusBadge';
import PriorityBadge from '../components/ui/PriorityBadge';
import ActionButtons from '../components/request/ActionButtons';
import RequestTimeline from '../components/request/RequestTimeline';
import { Skeleton } from '../components/ui/Skeleton';
import { formatDateTime } from '../lib/utils';
import type { Status } from '../types';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['request', Number(id)],
    queryFn: () => requestsApi.getById(Number(id)),
    enabled: !!id,
  });

  const request = data?.data?.request;

  const handleBack = () => {
    if (user?.role === 'manager') navigate('/manager');
    else if (user?.role === 'admin') navigate('/admin');
    else navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <button onClick={handleBack} className="btn-secondary">← Back</button>
        <div className="card p-6 space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-4">
        <button onClick={handleBack} className="btn-secondary">← Back</button>
        <div className="card p-8 text-center">
          <p className="text-slate-500">Request not found or you don't have access.</p>
        </div>
      </div>
    );
  }

  const availableTransitions = (request.availableTransitions ?? []) as Status[];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <button onClick={handleBack} className="btn-secondary">
        ← Back
      </button>

      {/* Main card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <p className="text-xs text-slate-400 mb-1">#{request.id} · {request.category}</p>
            <h1 className="text-xl font-bold text-slate-900">{request.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mb-6">
          {request.description}
        </p>

        {/* Meta info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Submitted by</p>
            <p className="font-medium text-slate-700">{request.requester_name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Created</p>
            <p className="font-medium text-slate-700">{formatDateTime(request.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Last updated</p>
            <p className="font-medium text-slate-700">{formatDateTime(request.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {availableTransitions.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Actions</h2>
          <ActionButtons requestId={request.id} availableTransitions={availableTransitions} />
        </div>
      )}

      {/* Timeline */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-slate-700">Activity Timeline</h2>
        <RequestTimeline requestId={request.id} />
      </div>
    </div>
  );
}
