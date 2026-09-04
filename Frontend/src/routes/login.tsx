import { createFileRoute, Link } from '@tanstack/react-router';

function PlaceholderPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
      <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-center">
        <h1 className="text-xl font-bold">Coming soon</h1>
        <p className="mt-2 text-sm text-slate-400">This section has not been copied into Code Tutor yet.</p>
        <Link to="/practice" className="mt-5 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
          Go to Practice
        </Link>
      </div>
    </main>
  );
}

export const Route = createFileRoute('/login')({
  component: PlaceholderPage,
});
