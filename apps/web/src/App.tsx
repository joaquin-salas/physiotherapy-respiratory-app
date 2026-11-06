import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { ExercisesPage } from '@/features/exercises/ExercisesPage';

/** All the pages of the panel. Every page is rendered inside AppLayout. */
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/exercises" replace /> },
      { path: 'exercises', element: <ExercisesPage /> },
    ],
  },
]);
