import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi } from '../../lib/api';
import { CATEGORIES, getErrorMessage } from '../../lib/utils';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Please provide more detail (at least 10 characters)'),
  category: z.string().min(1, 'Select a category'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
});
type FormData = z.infer<typeof schema>;

interface RequestFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RequestForm({ onSuccess, onCancel }: RequestFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'Medium' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => requestsApi.create(data),
    onSuccess: () => {
      toast.success('Request submitted successfully!');
      reset();
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div>
        <label className="label">Title <span className="text-red-400">*</span></label>
        <input
          type="text"
          className="input"
          placeholder="Brief title of your request"
          {...register('title')}
        />
        {errors.title && <p className="error-text">{errors.title.message}</p>}
      </div>

      <div>
        <label className="label">Description <span className="text-red-400">*</span></label>
        <textarea
          className="input resize-none"
          rows={4}
          placeholder="Describe what you need and why…"
          {...register('description')}
        />
        {errors.description && <p className="error-text">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category <span className="text-red-400">*</span></label>
          <select className="input" {...register('category')}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.category && <p className="error-text">{errors.category.message}</p>}
        </div>

        <div>
          <label className="label">Priority <span className="text-red-400">*</span></label>
          <select className="input" {...register('priority')}>
            {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.priority && <p className="error-text">{errors.priority.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary"
        >
          {mutation.isPending ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting…
            </>
          ) : (
            'Submit Request'
          )}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
