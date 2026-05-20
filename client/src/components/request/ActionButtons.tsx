import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { requestsApi } from '../../lib/api';
import { ACTION_CONFIG } from '../../lib/workflow';
import { getErrorMessage } from '../../lib/utils';
import Modal from '../ui/Modal';
import type { Status } from '../../types';

interface ActionButtonsProps {
  requestId: number;
  availableTransitions: Status[];
}

interface ActionModalState {
  targetStatus: Status | null;
  comment: string;
}

export default function ActionButtons({ requestId, availableTransitions }: ActionButtonsProps) {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ActionModalState>({ targetStatus: null, comment: '' });

  const mutation = useMutation({
    mutationFn: ({ status, comment }: { status: Status; comment?: string }) =>
      requestsApi.updateStatus(requestId, status, comment),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['logs', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      setModal({ targetStatus: null, comment: '' });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  if (availableTransitions.length === 0) return null;

  const handleConfirm = () => {
    if (!modal.targetStatus) return;
    mutation.mutate({
      status: modal.targetStatus,
      comment: modal.comment || undefined,
    });
  };

  const targetConfig = modal.targetStatus ? ACTION_CONFIG[modal.targetStatus] : null;
  const needsComment = modal.targetStatus === 'Needs Clarification' || modal.targetStatus === 'Rejected';

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {availableTransitions.map((status) => {
          const config = ACTION_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setModal({ targetStatus: status, comment: '' })}
              className={config.btnClass}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      <Modal
        isOpen={!!modal.targetStatus}
        onClose={() => setModal({ targetStatus: null, comment: '' })}
        title="Confirm Action"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{targetConfig?.confirmMsg}</p>

          <div>
            <label className="label">
              {needsComment ? 'Comment (required)' : 'Comment (optional)'}
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder={
                modal.targetStatus === 'Needs Clarification'
                  ? 'Describe what information you need…'
                  : modal.targetStatus === 'Rejected'
                  ? 'Reason for rejection…'
                  : 'Add a note (optional)…'
              }
              value={modal.comment}
              onChange={(e) => setModal((m) => ({ ...m, comment: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleConfirm}
              disabled={mutation.isPending || (needsComment && !modal.comment.trim())}
              className={targetConfig?.btnClass ?? 'btn-primary'}
            >
              {mutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing…
                </>
              ) : (
                'Confirm'
              )}
            </button>
            <button
              onClick={() => setModal({ targetStatus: null, comment: '' })}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
