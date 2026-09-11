import { createFileRoute, Navigate, Outlet, useRouterState } from '@tanstack/react-router';

import { LoadingScreen } from '@/components/common/loading-screen';
import { useAuth } from '@/features/authentication';

function AuthenticatedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  if (isLoading) {
    return <LoadingScreen message="Checking session" />;
  }

  if (!isAuthenticated) {
    return <Navigate search={{ redirect: pathname }} to="/signup" />;
  }

  return <Outlet />;
}

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedRoute,
});
