import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  LogOut,
  Map as MapIcon,
  Moon,
  Sun,
  User,
  LayoutDashboard,
  Code2,
  Target,
  Trophy,
  Terminal,
  Menu,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth } from '@/features/authentication';
import { useTheme } from '@/providers/theme-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard' as const,
    colorClass: 'text-cyan-500 dark:text-cyan-400 light:text-cyan-600 drop-shadow-[0_0_4px_rgba(6,182,212,0.4)]',
  },
  {
    label: 'Practice',
    icon: Code2,
    to: '/practice' as const,
    colorClass: 'text-amber-500 dark:text-amber-400 light:text-amber-600 drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]',
  },
  {
    label: 'Roadmap',
    icon: MapIcon,
    to: '/roadmap' as const,
    colorClass: 'text-emerald-500 dark:text-emerald-400 light:text-emerald-600 drop-shadow-[0_0_4px_rgba(16,185,129,0.4)]',
  },
  {
    label: 'Progress',
    icon: Target,
    to: '/progress' as const,
    colorClass: 'text-violet-500 dark:text-violet-400 light:text-violet-600 drop-shadow-[0_0_4px_rgba(139,92,246,0.4)]',
  },
  {
    label: 'Leaderboard',
    icon: Trophy,
    to: '/leaderboard' as const,
    colorClass: 'text-rose-500 dark:text-rose-400 light:text-rose-600 drop-shadow-[0_0_4px_rgba(244,63,94,0.4)]',
  },
];

interface TopNavigationProps {
  isDark?: boolean;
  setIsDark?: (val: boolean) => void;
  activeTab: string;
}

export function TopNavigation({ isDark: propIsDark, setIsDark: propSetIsDark, activeTab }: TopNavigationProps) {
  const { logout, user } = useAuth();
  const { isDark: globalIsDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleMouseEnter = () => {
    // Only use hover events on desktop devices with fine pointer (mouse/trackpad)
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      setMenuOpen(false);
    }, 200); // 200ms delay to prevent flickering
  };

  const handleTriggerClick = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMenuOpen(false);
      const button = wrapperRef.current?.querySelector('button');
      if (button) (button as HTMLElement).focus();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const isDark = propIsDark !== undefined ? propIsDark : globalIsDark;

  const handleThemeToggle = () => {
    if (propSetIsDark) {
      propSetIsDark(!isDark);
    } else {
      toggleTheme();
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    void navigate({ to: '/auth/login' });
  };

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-500',
        scrolled ? 'shadow-md' : '',
        isDark
          ? 'border-white/[0.04] bg-[#09090b]/80'
          : 'border-violet-600/20 bg-violet-600/90 text-white shadow-xl',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Hover Menu Trigger */}
        <div className="flex items-center gap-4">
          <Link className="flex shrink-0 items-center gap-3" to="/practice">
            <span className="text-lg font-bold tracking-tight text-white">
              Code Tutor
            </span>
          </Link>

          {/* Hover Menu Trigger beside title */}
          <div
            ref={wrapperRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onKeyDown={handleKeyDown}
            className="relative"
          >
            <button
              aria-label="Navigation Menu"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-controls="nav-dropdown-menu"
              onClick={handleTriggerClick}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg outline-none transition-all duration-200 border',
                isDark
                  ? 'border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.08] hover:text-white'
                  : 'border-white/20 bg-black/10 text-violet-100 hover:bg-black/20 hover:text-white',
              )}
              type="button"
            >
              <Menu className="h-4 w-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  id="nav-dropdown-menu"
                  role="menu"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    'absolute left-0 top-full z-50 mt-1.5 w-52 rounded-xl border p-1.5 shadow-2xl backdrop-blur-2xl transition-all duration-200',
                    isDark
                      ? 'border-white/[0.08] bg-black/85 text-slate-100 shadow-[0_8px_32px_0_rgba(0,0,0,0.7)]'
                      : 'border-slate-200/50 bg-white/85 text-slate-900 shadow-[0_8px_32px_0_rgba(139,92,246,0.25)]',
                  )}
                >
                  {navItems.map((item) => {
                    const isActive = item.label.toLowerCase() === activeTab.toLowerCase();
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 border border-transparent',
                          isActive
                            ? isDark
                              ? 'bg-white/[0.08] text-white border-white/5 shadow-sm'
                              : 'bg-violet-500/10 text-violet-700 border-violet-500/10 shadow-sm'
                            : isDark
                              ? 'text-slate-400 hover:text-white hover:bg-white/[0.04] hover:border-white/5'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-500/5 hover:border-slate-500/10',
                        )}
                      >
                        <item.icon className={cn('h-3.5 w-3.5', item.colorClass)} />
                        {item.label}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav
          className={cn(
            'hidden items-center gap-1 rounded-full border p-1 shadow-sm transition-colors xl:flex',
            isDark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-white/10 bg-black/10',
          )}
        >
          {navItems.map((item) => {
            const isActive = item.label.toLowerCase() === activeTab.toLowerCase();
            const className = cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300',
              isActive
                ? isDark
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'bg-white/20 text-white shadow-sm'
                : cn(
                    'hover:-translate-y-0.5',
                    isDark
                      ? 'text-slate-500 hover:text-violet-200 hover:bg-white/[0.04] hover:shadow-[0_0_12px_rgba(139,92,246,0.25)]'
                      : 'text-violet-100 hover:text-white hover:bg-white/10 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)]',
                  ),
            );

            return (
              <Link className={className} key={item.label} to={item.to}>
                <item.icon className={cn("h-3.5 w-3.5", item.colorClass)} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Global Controls & Dropdown */}
        <div className="flex items-center gap-2">
          {/* Notification Button */}
          <button
            aria-label="Notifications"
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full outline-none transition',
              isDark
                ? 'bg-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white'
                : 'bg-transparent text-violet-100 hover:bg-white/10 hover:text-white',
            )}
            type="button"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            aria-label="Toggle Theme"
            onClick={handleThemeToggle}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full outline-none transition',
              isDark
                ? 'bg-transparent text-slate-400 hover:bg-white/[0.05] hover:text-white'
                : 'bg-transparent text-violet-100 hover:bg-white/10 hover:text-white',
            )}
            type="button"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Profile Dropdown Menu */}
          <div className="relative ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 outline-none transition',
                    isDark
                      ? 'border-white/[0.05] bg-[#161618] hover:bg-white/[0.05]'
                      : 'border-white/10 bg-black/10 text-white hover:bg-black/20',
                  )}
                  type="button"
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center overflow-hidden rounded-full text-xs font-bold',
                      isDark ? 'bg-violet-600 text-white' : 'bg-white text-violet-600',
                    )}
                  >
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.fullName || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      userInitials
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 transition-transform duration-300',
                      isDark ? 'text-slate-400' : 'text-violet-200',
                    )}
                  />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className={cn(
                  'z-50 w-48 rounded-xl border p-1.5 shadow-2xl backdrop-blur-md',
                  isDark
                    ? 'border-white/[0.08] bg-[#0c0a0f]/60 text-slate-100 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]'
                    : 'border-slate-200/50 bg-white/60 text-slate-900 shadow-[0_8px_32px_0_rgba(139,92,246,0.15)]',
                )}
              >
                <DropdownMenuItem asChild>
                  <Link
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border border-transparent hover:border-white/5"
                    to="/profile"
                  >
                    <User className="h-3.5 w-3.5 text-blue-400 dark:text-blue-400 light:text-blue-600 drop-shadow-[0_0_3px_rgba(96,165,250,0.4)]" /> Account
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium border border-transparent hover:border-white/5"
                      to="/agent-logs"
                    >
                      <Terminal className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-400 light:text-emerald-600 drop-shadow-[0_0_3px_rgba(52,211,153,0.4)]" /> Agent Logs
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className={isDark ? 'bg-white/[0.04]' : 'bg-slate-100'} />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 border border-transparent"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-500 drop-shadow-[0_0_3px_rgba(244,63,94,0.4)]" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

