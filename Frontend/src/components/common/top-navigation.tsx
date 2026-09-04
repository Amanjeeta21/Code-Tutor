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
    colorClass: 'text-[#5c6f1d]',
  },
  {
    label: 'Practice',
    icon: Code2,
    to: '/practice' as const,
    colorClass: 'text-[#8aa500]',
  },
  {
    label: 'Roadmap',
    icon: MapIcon,
    to: '/roadmap' as const,
    colorClass: 'text-[#5c6f1d]',
  },
  {
    label: 'Progress',
    icon: Target,
    to: '/progress' as const,
    colorClass: 'text-[#8aa500]',
  },
  {
    label: 'Leaderboard',
    icon: Trophy,
    to: '/leaderboard' as const,
    colorClass: 'text-[#5c6f1d]',
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

  const isDark = propIsDark !== undefined ? propIsDark : globalIsDark;

  const handleMouseEnter = () => {
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
    }, 200);
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

  const handleThemeToggle = () => {
    if (propSetIsDark) {
      propSetIsDark(!isDark);
    } else {
      toggleTheme();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

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
        'fixed inset-x-0 top-0 z-50 border-b border-[#d8d0bb] bg-[#fffaf0]/95 text-[#10170d] backdrop-blur-xl transition-all duration-500',
        scrolled ? 'shadow-md shadow-[#10200d]/10' : 'shadow-sm shadow-[#10200d]/5',
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link className="flex shrink-0 items-center gap-3" to="/practice">
            <span className="text-lg font-bold tracking-tight text-[#10170d]">Code Tutor</span>
          </Link>

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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8d0bb] bg-[#ece5d5] text-[#514b3d] outline-none transition-all duration-200 hover:border-[#a5bd3c] hover:bg-[#e8f2ad] hover:text-[#405400]"
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
                  className="absolute left-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-[#d8d0bb] bg-[#fffaf0]/95 p-1.5 text-[#10170d] shadow-2xl shadow-[#10200d]/10 backdrop-blur-2xl transition-all duration-200"
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
                          'flex w-full cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-xs font-semibold transition-all duration-200',
                          isActive
                            ? 'border-[#a5bd3c]/30 bg-[#e8f2ad] text-[#405400] shadow-sm'
                            : 'text-[#514b3d] hover:border-[#d8d0bb] hover:bg-[#ece5d5] hover:text-[#10170d]',
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

        <nav className="hidden items-center gap-1 rounded-full border border-[#d8d0bb] bg-[#ece5d5]/70 p-1 shadow-sm shadow-[#10200d]/5 transition-colors xl:flex">
          {navItems.map((item) => {
            const isActive = item.label.toLowerCase() === activeTab.toLowerCase();
            const className = cn(
              'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300',
              isActive
                ? 'bg-[#a5bd3c] text-[#10170d] shadow-sm shadow-[#10200d]/10'
                : 'text-[#514b3d] hover:bg-[#fffaf0] hover:text-[#10170d]',
            );

            return (
              <Link className={className} key={item.label} to={item.to}>
                <item.icon className={cn('h-3.5 w-3.5', item.colorClass)} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[#514b3d] outline-none transition hover:bg-[#ece5d5] hover:text-[#10170d]"
            type="button"
          >
            <Bell className="h-4 w-4" />
          </button>

          <button
            aria-label="Toggle Theme"
            onClick={handleThemeToggle}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-[#514b3d] outline-none transition hover:bg-[#ece5d5] hover:text-[#10170d]"
            type="button"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative ml-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 rounded-full border border-[#d8d0bb] bg-[#ece5d5] py-1 pl-1 pr-3 text-[#10170d] outline-none transition hover:border-[#a5bd3c] hover:bg-[#e8f2ad]"
                  type="button"
                >
                  <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#a5bd3c] text-xs font-bold text-[#10170d]">
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
                  <ChevronDown className="h-3.5 w-3.5 text-[#514b3d] transition-transform duration-300" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="z-50 w-48 rounded-xl border border-[#d8d0bb] bg-[#fffaf0]/95 p-1.5 text-[#10170d] shadow-2xl shadow-[#10200d]/10 backdrop-blur-md"
              >
                <DropdownMenuItem asChild>
                  <Link
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs font-medium hover:border-[#d8d0bb] hover:bg-[#ece5d5]"
                    to="/profile"
                  >
                    <User className="h-3.5 w-3.5 text-[#5c6f1d]" /> Account
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link
                      className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs font-medium hover:border-[#d8d0bb] hover:bg-[#ece5d5]"
                      to="/agent-logs"
                    >
                      <Terminal className="h-3.5 w-3.5 text-[#5c6f1d]" /> Agent Logs
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-[#d8d0bb]" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-[#7b2116] hover:bg-[#ffe0d8] hover:text-[#7b2116]"
                >
                  <LogOut className="h-3.5 w-3.5 text-[#7b2116]" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
