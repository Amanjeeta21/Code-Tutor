import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/features/authentication/auth-page';

export const Route = createFileRoute('/signup')({
  component: () => <AuthPage initialMode="signup" />,
});
