import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/features/authentication/auth-page';

export const Route = createFileRoute('/login')({
  component: () => <AuthPage initialMode="login" />,
});
