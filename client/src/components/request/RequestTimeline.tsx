import { useQuery } from '@tanstack/react-query';
import { requestsApi } from '../../lib/api';
import { formatDateTime, getInitials } from '../../lib/utils';
import StatusBadge from '../ui/StatusBadge';
import { Skeleton } from '../ui/Skeleton';
import type { Status } from '../../types';

interface Props {
  requestId: number;
}

export default function RequestTimeline({ requestId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['logs', requestId],
    queryFn: () => requestsApi.getLogs(requestId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const logs = data?.data?.logs ?? [];

  if (logs.length === 0) {
    return <p className="text-sm text-slate-400 mt-4">No activity yet.</p>;
  }

  return (
    <div className="mt-4 space-y-0">
      {logs.map((log, idx) => {
        const isLast = idx === logs.length - 1;
        return (
          <div key={log.id} className="flex gap-4">
            {/* Connector line */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 z-10">
                <span className="text-xs font-semibold text-slate-600">
                  {getInitials(log.changed_by_name)}
                </span>
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-slate-200 my-1" />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-6 ${isLast ? '' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-medium text-slate-900">{log.changed_by_name}</span>
                  <span className="text-sm text-slate-400"> · </span>
                  <span className="text-xs text-slate-400 capitalize">{log.role}</span>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatDateTime(log.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {log.old_status ? (
                  <>
                    <StatusBadge status={log.old_status as Status} />
                    <span className="text-slate-300 text-sm">→</span>
                    <StatusBadge status={log.new_status as Status} />
                  </>
                ) : (
                  <StatusBadge status={log.new_status as Status} />
                )}
              </div>

              {log.comment && (
                <div className="mt-2 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600 border-l-2 border-slate-200">
                  {log.comment}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
