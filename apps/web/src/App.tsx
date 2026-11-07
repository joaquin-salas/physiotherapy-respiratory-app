import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ExercisesPage } from '@/features/exercises/ExercisesPage';

/** All the pages of the panel. Everything except /login requires a logged-in user. */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/exercises" replace /> },
          { path: 'exercises', element: <ExercisesPage /> },
        ],
      },
    ],
  },
]);
