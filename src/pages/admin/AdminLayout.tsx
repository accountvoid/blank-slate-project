import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/hooks/useAuth';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  LayoutDashboard,
  Users,
  Shield,
  Swords,
  ScrollText,
  Sparkles,
  DoorOpen,
  Package,
  Boxes,
  CalendarDays,
  Wallet,
  FileClock,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/roles', label: 'Roles', icon: Shield },
  { to: '/admin/main-quests', label: 'Main Quests', icon: Swords },
  { to: '/admin/side-quests', label: 'Side Quests', icon: ScrollText },
  { to: '/admin/grand-quests', label: 'Grand Quests', icon: Sparkles },
  { to: '/admin/gates', label: 'Gates', icon: DoorOpen },
  { to: '/admin/main-items', label: 'Main Items', icon: Package },
  { to: '/admin/side-items', label: 'Side Items', icon: Boxes },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/payments', label: 'Payments', icon: Wallet },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileClock },
  { to: '/admin/settings', label: 'System Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!loading && user && !isAdmin) navigate('/', { replace: true });
  }, [loading, isAdmin, user, navigate]);

  if (authLoading || loading) return <LoadingScreen fullScreen message="ADMIN" />;
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/admin" className="text-lg font-bold tracking-widest text-primary">
            SETVOID · ADMIN
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Enterprise Panel</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          <button
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
