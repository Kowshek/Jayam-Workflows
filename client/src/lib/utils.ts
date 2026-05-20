export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function getErrorMessage(error: unknown): string {
  if (axios_isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message
    );
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

// Mini axios type guard (avoids importing axios just for this)
function axios_isAxiosError(err: unknown): err is {
  response?: { data?: { error?: string; message?: string } };
  message: string;
} {
  return typeof err === 'object' && err !== null && 'response' in err;
}

export const CATEGORIES = [
  'IT Equipment',
  'Software',
  'IT Access',
  'Travel',
  'Training',
  'Office Supplies',
  'Events',
  'Finance',
  'HR',
  'Other',
] as const;
