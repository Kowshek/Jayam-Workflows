import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../lib/utils';
import type { Role } from '../types';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const ROLE_REDIRECT: Record<Role, string> = {
  user: '/dashboard',
  manager: '/manager',
  admin: '/admin',
};

const DEMO_ACCOUNTS = [
  { label: 'Employee', email: 'user@test.com', role: 'user' },
  { label: 'Manager',  email: 'manager@test.com', role: 'manager' },
  { label: 'Admin',    email: 'admin@test.com', role: 'admin' },
];

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data.email, data.password);
      setAuth(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(ROLE_REDIRECT[res.data.user.role]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Test@1234');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-indigo-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
            <span className="text-white text-xl font-bold">JW</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">WorkFlow</h1>
          <p className="text-sm text-slate-500 mt-1">Role-Based Approval System</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
                {...register('email')}
                autoComplete="email"
              />
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('password')}
                autoComplete="current-password"
              />
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-5">
          <p className="text-xs text-center text-slate-400 mb-3">Quick access — demo accounts</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                onClick={() => fillDemo(acc.email)}
                className="card px-3 py-2.5 text-xs text-center hover:border-indigo-300
                           hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-700">{acc.label}</div>
                <div className="text-slate-400 truncate mt-0.5">{acc.email}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-center text-slate-400 mt-2">Password: <code className="bg-slate-100 px-1 rounded">Test@1234</code></p>
        </div>
      </div>
    </div>
  );
}
