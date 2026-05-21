import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getInitials } from '../../lib/utils';
import type { Role } from '../../types';

interface NavItem {
  label: string;
  to: string;
  icon: string;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'My Requests',   to: '/dashboard',  icon: '📋', roles: ['user'] },
  { label: 'New Request',   to: '/dashboard?new=1', icon: '✏️', roles: ['user'] },
  { label: 'Review Queue',  to: '/manager',    icon: '📥', roles: ['manager'] },
  { label: 'All Requests',  to: '/admin',      icon: '🗂️', roles: ['admin'] },
];

const ROLE_LABEL: Record<Role, string> = {
  user: 'Employee',
  manager: 'Manager',
  admin: 'Administrator',
};

const ROLE_COLOR: Record<Role, string> = {
  user:    'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
  admin:   'bg-violet-100 text-violet-700',
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!user) return null;

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">JW</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">WorkFlow</p>
            <p className="text-xs text-slate-400">Approval System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to !== '/manager' && item.to !== '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{getInitials(user.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </div>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${ROLE_COLOR[user.role]}`}>
          {ROLE_LABEL[user.role]}
        </span>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600
                     hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>←</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}
