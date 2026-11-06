import { Dumbbell } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { cn } from '@/lib/utils';

const navItems = [{ to: '/exercises', label: 'Ejercicios', icon: Dumbbell }];

/** Page frame shared by all screens: sidebar on the left, current page on the right. */
export function AppLayout() {
  return (
    <div className="flex min-h-svh">
      <aside className="w-60 shrink-0 border-r bg-sidebar p-4">
        <p className="mb-6 px-2 text-lg font-semibold">Fisio Respira</p>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-sidebar-accent',
                  isActive && 'bg-sidebar-accent font-medium',
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        {/* The page that matches the current URL is rendered here */}
        <Outlet />
      </main>
    </div>
  );
}
