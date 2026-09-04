import logoNoBg from '@/assets/logo_no_background.png';

interface LoadingScreenProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingScreen({ message = 'Loading...', fullPage = true }: LoadingScreenProps) {
  const containerClasses = fullPage
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#070510] text-slate-100 font-sans'
    : 'flex h-full w-full min-h-[400px] items-center justify-center bg-[#070510] text-slate-100 font-sans';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-6">
        {/* Logo with Breathe & Glow animation */}
        <div className="relative h-20 w-20">
          <img
            src={logoNoBg}
            alt="Logo"
            className="h-full w-full object-contain animate-logo-breathe"
          />
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          {/* Custom Message */}
          <p className="text-xs font-bold uppercase tracking-widest text-violet-400/90">
            {message}
          </p>

          {/* Slim Custom loading progress bar */}
          <div className="relative h-0.5 w-36 overflow-hidden rounded bg-white/10">
            <div className="animate-loading-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
