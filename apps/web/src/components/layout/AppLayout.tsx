import { ClipboardList, Dumbbell, LogOut, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { useCurrentUser, useLogout } from '@/features/auth/auth.hooks';
import { cn } from '@/lib/utils';
import { BrandMark } from './BrandMark';

type NavItem = { to: string; label: string; icon: typeof Users };

const mainItems: NavItem[] = [
  { to: '/patients', label: 'Pacientes', icon: Users },
];
const libraryItems: NavItem[] = [
  { to: '/exercises', label: 'Ejercicios', icon: Dumbbell },
  { to: '/templates', label: 'Plantillas', icon: ClipboardList },
];

function NavItems({ items }: { items: NavItem[] }) {
  return items.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        cn(
          'flex h-11 items-center gap-2 rounded-md px-3 text-[15px] hover:bg-sidebar-accent',
          isActive &&
            'bg-sidebar-primary font-semibold text-sidebar-primary-foreground hover:bg-sidebar-primary',
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  ));
}

/** Page frame shared by all screens: sidebar on the left, current page on the right. */
export function AppLayout() {
  const { data: user } = useCurrentUser(); // always set here: RequireAuth wraps this layout
  const logout = useLogout();

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <BrandMark />
          <span className="text-xl font-bold tracking-tight">Fisio Respira</span>
        </div>
        <nav className="flex flex-col gap-1">
          <NavItems items={mainItems} />
          <p className="mt-6 mb-1 px-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Biblioteca
          </p>
          <NavItems items={libraryItems} />
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-t border-sidebar-border pt-4">
          <p className="truncate px-2 text-sm">
            {user?.physiotherapist?.fullName ?? user?.email}
          </p>
          <Button
            variant="ghost"
            className="justify-start"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {/* The page that matches the current URL is rendered here */}
        <Outlet />
      </main>
    </div>
  );
}
