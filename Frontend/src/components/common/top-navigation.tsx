import { useEffect, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  Code2,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageCircle,
  Moon,
  PanelLeftClose,
  Send,
  Sun,
  Target,
  Terminal,
  Trophy,
  User,
  X,
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
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' as const },
  { label: 'Practice', icon: Code2, to: '/practice' as const },
  { label: 'Roadmap', icon: MapIcon, to: '/roadmap' as const },
  { label: 'Progress', icon: Target, to: '/progress' as const },
  { label: 'Leaderboard', icon: Trophy, to: '/leaderboard' as const },
];

const assistantReplies = [
  {
    patterns: ['hi', 'hello', 'hey'],
    reply: 'Hey, I am Code Tutor assistant. I can help you find Dashboard, Practice, Roadmap, Progress, and Leaderboard.',
  },
  {
    patterns: ['dashboard', 'home', 'overview'],
    reply: 'Open Dashboard to see your practice overview, progress cards, activity, and recent submissions.',
  },
  {
    patterns: ['practice', 'question', 'problem', 'solve'],
    reply: 'Open Practice to browse questions. Click a problem name or Solve to open it in the code editor.',
  },
  {
    patterns: ['roadmap'],
    reply: 'Roadmap is for your learning path and topic sequence.',
  },
  {
    patterns: ['progress'],
    reply: 'Progress shows how your practice is improving across topics and time.',
  },
  {
    patterns: ['leaderboard', 'rank'],
    reply: 'Leaderboard is where ranking and peer progress will appear.',
  },
];

interface TopNavigationProps {
  isDark?: boolean;
  setIsDark?: (val: boolean) => void;
  activeTab: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export function TopNavigation({ isDark: propIsDark, setIsDark: propSetIsDark, activeTab }: TopNavigationProps) {
  const { logout, user } = useAuth();
  const { isDark: globalIsDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isDark = propIsDark !== undefined ? propIsDark : globalIsDark;
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('code-tutor-sidebar') !== 'closed';
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: 'Hi. Ask me where to find practice questions, progress, roadmap, or leaderboard.' },
  ]);

  useEffect(() => {
    const sidebarWidth = isSidebarOpen ? '16rem' : '5rem';
    document.documentElement.style.setProperty('--app-sidebar-width', sidebarWidth);
    window.localStorage.setItem('code-tutor-sidebar', isSidebarOpen ? 'open' : 'closed');
  }, [isSidebarOpen]);

  const handleThemeToggle = () => {
    if (propSetIsDark) {
      propSetIsDark(!isDark);
    } else {
      toggleTheme();
    }
  };

  const handleLogout = async () => {
    await logout();
    void navigate({ to: '/signup' });
  };

  const handleSendMessage = () => {
    const question = chatInput.trim();
    if (!question) return;

    const normalizedQuestion = question.toLowerCase();
    const matchedReply = assistantReplies.find((item) =>
      item.patterns.some((pattern) => normalizedQuestion.includes(pattern)),
    );

    setMessages((current) => [
      ...current,
      { role: 'user', text: question },
      {
        role: 'assistant',
        text: matchedReply?.reply ?? 'I can help with navigation for now. Try asking about Dashboard, Practice, Roadmap, Progress, or Leaderboard.',
      },
    ]);
    setChatInput('');
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
    <>
      <motion.aside
        initial={{ x: -96, opacity: 0 }}
        animate={{ x: 0, opacity: 1, width: isSidebarOpen ? 256 : 80 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#33450e] bg-[#5c6f1d] text-[#fffaf0] shadow-xl shadow-[#10200d]/20"
      >
        <div className="flex h-full flex-col px-3 py-5 md:px-4">
          <div className="mb-7 flex items-center justify-between gap-2">
            <Link className="flex min-w-0 items-center justify-center md:justify-start" to="/dashboard" viewTransition>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#d9ef69] text-sm font-black text-[#10170d] shadow-sm shadow-[#10200d]/15">
                CT
              </span>
              <AnimatePresence initial={false}>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="ml-3 hidden overflow-hidden whitespace-nowrap text-lg font-black tracking-tight md:inline"
                  >
                    Code Tutor
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            <button
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Open sidebar'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d9ef69]/25 bg-[#405400]/45 text-[#fffaf0] transition hover:bg-[#33450e]"
              onClick={() => setIsSidebarOpen((open) => !open)}
              type="button"
            >
              {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-2">
            {navItems.map((item) => {
              const isActive = item.label.toLowerCase() === activeTab.toLowerCase();
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  title={item.label}
                  viewTransition
                  className={cn(
                    'flex h-11 items-center justify-center rounded-xl border text-sm font-bold transition',
                    isSidebarOpen ? 'md:justify-start md:gap-3 md:px-3' : 'md:px-0',
                    isActive
                      ? 'border-[#d9ef69]/50 bg-[#e8f2ad] text-[#10170d] shadow-sm shadow-[#10200d]/15'
                      : 'border-transparent text-[#f4f0e6] hover:border-[#d9ef69]/30 hover:bg-[#405400] hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {isSidebarOpen && <span className="hidden md:inline">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 flex flex-col gap-2 border-t border-[#d9ef69]/25 pt-4">
            <button
              aria-label="Notifications"
              className={cn(
                'flex h-10 items-center justify-center rounded-xl border border-transparent text-[#f4f0e6] transition hover:border-[#d9ef69]/30 hover:bg-[#405400] hover:text-white',
                isSidebarOpen ? 'md:justify-start md:gap-3 md:px-3' : 'md:px-0',
              )}
              type="button"
            >
              <Bell className="h-4 w-4" />
              {isSidebarOpen && <span className="hidden text-sm font-bold md:inline">Alerts</span>}
            </button>

            <button
              aria-label="Toggle Theme"
              onClick={handleThemeToggle}
              className={cn(
                'flex h-10 items-center justify-center rounded-xl border border-transparent text-[#f4f0e6] transition hover:border-[#d9ef69]/30 hover:bg-[#405400] hover:text-white',
                isSidebarOpen ? 'md:justify-start md:gap-3 md:px-3' : 'md:px-0',
              )}
              type="button"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isSidebarOpen && <span className="hidden text-sm font-bold md:inline">Theme</span>}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex h-11 items-center justify-center rounded-xl border border-[#d9ef69]/30 bg-[#405400]/55 text-[#fffaf0] outline-none transition hover:border-[#d9ef69] hover:bg-[#33450e]',
                    isSidebarOpen ? 'md:justify-start md:gap-3 md:px-2' : 'md:px-0',
                  )}
                  type="button"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#d9ef69] text-xs font-black text-[#10170d]">
                    {user?.image ? (
                      <img src={user.image} alt={user.fullName || 'User'} className="h-full w-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </span>
                  {isSidebarOpen && (
                    <>
                      <span className="hidden min-w-0 flex-1 truncate text-left text-sm font-bold md:block">
                        {user?.fullName || 'User'}
                      </span>
                      <ChevronDown className="hidden h-3.5 w-3.5 text-[#f4f0e6] md:block" />
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                side="right"
                className="z-50 w-48 rounded-xl border border-[#d8d0bb] bg-[#fffaf0]/95 p-1.5 text-[#10170d] shadow-2xl shadow-[#10200d]/10 backdrop-blur-md"
              >
                <DropdownMenuItem asChild>
                  <Link className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs font-medium hover:border-[#d8d0bb] hover:bg-[#ece5d5]" to="/profile">
                    <User className="h-3.5 w-3.5 text-[#5c6f1d]" /> Account
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-transparent px-3 py-2 text-xs font-medium hover:border-[#d8d0bb] hover:bg-[#ece5d5]" to="/agent-logs">
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
      </motion.aside>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              className="flex h-[420px] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] text-[#10170d] shadow-2xl shadow-[#10200d]/20"
            >
              <div className="flex items-center justify-between border-b border-[#d8d0bb] bg-[#5c6f1d] px-4 py-3 text-[#fffaf0]">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[#d9ef69] text-[#10170d]">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-black">Code Tutor Chat</p>
                    <p className="text-[10px] font-semibold text-[#eef6bd]">Navigation helper</p>
                  </div>
                </div>
                <button aria-label="Close chat" className="rounded-lg p-1.5 transition hover:bg-[#405400]" onClick={() => setIsChatOpen(false)} type="button">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[82%] rounded-2xl px-3 py-2 text-xs font-medium leading-relaxed',
                        message.role === 'user'
                          ? 'bg-[#a5bd3c] text-[#10170d]'
                          : 'border border-[#d8d0bb] bg-[#ece5d5] text-[#514b3d]',
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 border-t border-[#d8d0bb] bg-[#ece5d5]/60 p-3">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Ask about navigation..."
                  className="min-w-0 flex-1 rounded-xl border border-[#d8d0bb] bg-[#fffaf0] px-3 py-2 text-xs font-semibold text-[#10170d] outline-none transition placeholder:text-[#8a836f] focus:border-[#a5bd3c] focus:ring-2 focus:ring-[#a5bd3c]/25"
                />
                <button
                  aria-label="Send message"
                  className="grid h-10 w-10 place-items-center rounded-xl bg-[#a5bd3c] text-[#10170d] transition hover:bg-[#bdd45a]"
                  onClick={handleSendMessage}
                  type="button"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          aria-label="Open Code Tutor chat"
          className="grid h-14 w-14 place-items-center rounded-full border border-[#d9ef69]/40 bg-[#5c6f1d] text-[#fffaf0] shadow-xl shadow-[#10200d]/20 transition hover:bg-[#405400]"
          onClick={() => setIsChatOpen((open) => !open)}
          type="button"
        >
          {isChatOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
}



