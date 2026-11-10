import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ExerciseDetailPage } from '@/features/exercises/ExerciseDetailPage';
import { ExercisesPage } from '@/features/exercises/ExercisesPage';
import { NewExercisePage } from '@/features/exercises/NewExercisePage';
import { NewPatientPage } from '@/features/patients/NewPatientPage';
import { PatientDetailPage } from '@/features/patients/PatientDetailPage';
import { PatientSetupPage } from '@/features/patients/PatientSetupPage';
import { PatientsPage } from '@/features/patients/PatientsPage';
import { NewRoutineTemplatePage } from '@/features/routine-templates/NewRoutineTemplatePage';
import { RoutineTemplateDetailPage } from '@/features/routine-templates/RoutineTemplateDetailPage';
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
          { path: 'patients/new', element: <NewPatientPage /> },
          { path: 'patients/:id', element: <PatientDetailPage /> },
          { path: 'patients/:id/setup', element: <PatientSetupPage /> },
          { path: 'templates', element: <RoutineTemplatesPage /> },
          { path: 'templates/new', element: <NewRoutineTemplatePage /> },
          { path: 'templates/:id', element: <RoutineTemplateDetailPage /> },
          { path: 'exercises', element: <ExercisesPage /> },
          { path: 'exercises/new', element: <NewExercisePage /> },
          { path: 'exercises/:id', element: <ExerciseDetailPage /> },
        ],
      },
    ],
  },
]);
