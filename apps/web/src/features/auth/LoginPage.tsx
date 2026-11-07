import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { useCurrentUser, useLogin } from './auth.hooks';

const loginSchema = z.object({
  email: z.email('Introduce un email válido'),
  password: z.string().min(1, 'Introduce tu contraseña'),
});

type LoginValues = z.infer<typeof loginSchema>;

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Email o contraseña incorrectos';
    if (error.status === 429)
      return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.';
  }
  return 'No se pudo conectar con el servidor';
}

export function LoginPage() {
  const { data: user } = useCurrentUser();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Already logged in (e.g. opened /login by hand): go to the panel
  if (user) {
    return <Navigate to={from} replace />;
  }

  async function onSubmit(values: LoginValues) {
    try {
      await login.mutateAsync(values);
      await navigate(from, { replace: true });
    } catch (error) {
      setError('root', { message: loginErrorMessage(error) });
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Fisio Respira</h1>
        <p className="mb-6 text-muted-foreground">
          Accede al panel del fisioterapeuta.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
              <FieldError errors={[errors.password]} />
            </Field>

            <FieldError errors={[errors.root]} />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
