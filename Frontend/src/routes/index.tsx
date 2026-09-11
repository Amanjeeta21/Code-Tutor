import { createFileRoute, Navigate } from '@tanstack/react-router';

import { LoadingScreen } from '@/components/common/loading-screen';
import { useAuth } from '@/features/authentication';

function HomeRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking session" />;
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/signup'} />;
}

export const Route = createFileRoute('/')({
  component: HomeRedirect,
});
