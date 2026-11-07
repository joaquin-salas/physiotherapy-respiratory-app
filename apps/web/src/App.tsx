import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ExercisesPage } from '@/features/exercises/ExercisesPage';
import { PatientDetailPage } from '@/features/patients/PatientDetailPage';
import { PatientsPage } from '@/features/patients/PatientsPage';
import { RoutineTemplatesPage } from '@/features/routine-templates/RoutineTemplatesPage';

/** All the pages of the panel. Everything except /login requires a logged-in user. */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/patients" replace /> },
          { path: 'patients', element: <PatientsPage /> },
          { path: 'patients/:id', element: <PatientDetailPage /> },
          { path: 'templates', element: <RoutineTemplatesPage /> },
          { path: 'exercises', element: <ExercisesPage /> },
        ],
      },
    ],
  },
]);
