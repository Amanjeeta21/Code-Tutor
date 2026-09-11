import { useNavigate, useRouterState } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/authentication';

type AuthMode = 'login' | 'signup';

type LoginForm = {
  identifier: string;
  password: string;
};

type SignupForm = {
  confirmPassword: string;
  email: string;
  password: string;
  username: string;
};

type LoginErrors = Partial<Record<keyof LoginForm | 'server', string>>;
type SignupErrors = Partial<Record<keyof SignupForm | 'server', string>>;

interface AuthPageProps {
  initialMode: AuthMode;
}

interface LoginSearch {
  redirect?: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const typewriterPhrases = ['Code Tutor', 'Practice with purpose', 'Solve. Learn. Repeat.'];

function validateLoginForm(form: LoginForm) {
  const errors: LoginErrors = {};
  const identifier = form.identifier.trim();

  if (!identifier) {
    errors.identifier = 'Enter your username or email.';
  } else if (identifier.includes('@') && !emailPattern.test(identifier)) {
    errors.identifier = 'Enter a valid email address.';
  }

  if (!form.password) {
    errors.password = 'Enter your password.';
  }

  return errors;
}

function validateSignupForm(form: SignupForm) {
  const errors: SignupErrors = {};
  const username = form.username.trim();
  const email = form.email.trim();

  if (!username) {
    errors.username = 'Choose a username.';
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.username = 'Use letters, numbers, and underscores only.';
  }

  if (!email) {
    errors.email = 'Enter your email.';
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.password) {
    errors.password = 'Create a password.';
  } else if (form.password.length < 8) {
    errors.password = 'Use at least 8 characters.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

function Field({
  autoComplete,
  endAdornment,
  error,
  icon,
  label,
  name,
  onChange,
  placeholder,
  type,
  value,
}: {
  autoComplete: string;
  endAdornment?: ReactNode;
  error?: string;
  icon: ReactNode;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type: string;
  value: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-[#eef6bd]">
        {label}
      </span>
      <span className="flex h-12 items-center gap-3 rounded-md border border-[#d9ef69]/30 bg-[#405400]/70 px-3 text-[#fffaf0] shadow-inner shadow-[#10200d]/25 transition focus-within:border-[#d9ef69] focus-within:bg-[#33450e] focus-within:ring-2 focus-within:ring-[#d9ef69]/25">
        <span className="text-[#d9ef69]">{icon}</span>
        <input
          autoComplete={autoComplete}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#fffaf0] outline-none placeholder:text-[#d8d0bb]/70"
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          type={type}
          value={value}
        />
        {endAdornment}
      </span>
      {error ? <span className="block text-xs font-bold text-[#ffd2c5]">{error}</span> : null}
    </label>
  );
}

function PasswordToggle({ isVisible, onToggle }: { isVisible: boolean; onToggle: () => void }) {
  const Icon = isVisible ? EyeOff : Eye;

  return (
    <button
      aria-label={isVisible ? 'Hide password' : 'Show password'}
      className="grid h-8 w-8 shrink-0 place-items-center rounded text-[#eef6bd] transition hover:bg-[#5c6f1d] hover:text-white"
      onClick={onToggle}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function TypewriterHeading() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = typewriterPhrases[phraseIndex];
    const isComplete = !isDeleting && displayText === phrase;
    const isCleared = isDeleting && displayText === '';

    const timeout = window.setTimeout(
      () => {
        if (isComplete) {
          setIsDeleting(true);
          return;
        }

        if (isCleared) {
          setIsDeleting(false);
          setPhraseIndex((current) => (current + 1) % typewriterPhrases.length);
          return;
        }

        setDisplayText((current) =>
          isDeleting ? phrase.slice(0, current.length - 1) : phrase.slice(0, current.length + 1),
        );
      },
      isComplete ? 1300 : isDeleting ? 42 : 78,
    );

    return () => window.clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  return (
    <h1 className="min-h-[7.5rem] text-5xl font-black leading-tight tracking-normal text-[#fffaf0] sm:text-6xl xl:text-7xl">
      <span>{displayText}</span>
      <span className="ml-1 inline-block h-[0.9em] w-1 translate-y-1 animate-pulse bg-[#d9ef69]" />
    </h1>
  );
}

export function AuthPage({ initialMode }: AuthPageProps) {
  const navigate = useNavigate();
  const search = useRouterState({
    select: (state) => state.location.search as LoginSearch,
  });
  const { checkSession } = useAuth();
  const isSubmitting = useRef(false);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginForm, setLoginForm] = useState<LoginForm>({ identifier: '', password: '' });
  const [signupForm, setSignupForm] = useState<SignupForm>({
    confirmPassword: '',
    email: '',
    password: '',
    username: '',
  });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setLoginErrors({});
    setSignupErrors({});
    void navigate({ to: nextMode === 'login' ? '/login' : '/signup' });
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting.current) return;

    const nextErrors = validateLoginForm(loginForm);
    setLoginErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    isSubmitting.current = true;
    setIsLoading(true);

    try {
      const identifier = loginForm.identifier.trim();
      const payload = identifier.includes('@')
        ? { email: identifier, password: loginForm.password }
        : { username: identifier, password: loginForm.password };

      const res = await fetch('/api/auth/login', {
        body: JSON.stringify(payload),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid username/email or password.');
      }

      await checkSession();
      const isAuthRedirect = search.redirect === '/login' || search.redirect === '/signup';
      const redirect = search.redirect?.startsWith('/') && !isAuthRedirect ? search.redirect : '/dashboard';
      void navigate({ to: redirect });
    } catch (err) {
      setLoginErrors({
        server: err instanceof Error ? err.message : 'Unable to log in right now.',
      });
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting.current) return;

    const nextErrors = validateSignupForm(signupForm);
    setSignupErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    isSubmitting.current = true;
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        body: JSON.stringify({
          email: signupForm.email.trim(),
          password: signupForm.password,
          username: signupForm.username.trim(),
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to create your account.');
      }

      await checkSession();
      void navigate({ to: '/dashboard' });
    } catch (err) {
      setSignupErrors({
        server: err instanceof Error ? err.message : 'Unable to sign up right now.',
      });
    } finally {
      setIsLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <main className="grid min-h-screen bg-[#f4f0e6] text-[#10170d] lg:grid-cols-2">
      <section className="relative flex min-h-[44vh] overflow-hidden bg-[#5c6f1d] text-[#fffaf0] lg:min-h-screen">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(217,239,105,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(217,239,105,0.09)_1px,transparent_1px)] bg-[size:42px_42px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(217,239,105,0.28),transparent_36%),radial-gradient(circle_at_74%_78%,rgba(16,23,13,0.26),transparent_40%)]" />
        <div className="relative z-10 flex w-full flex-col justify-between p-7 sm:p-10 xl:p-14">
          <div className="text-sm font-black uppercase tracking-[0.32em] text-[#d9ef69]">
            Code Tutor
          </div>

          <div className="max-w-xl space-y-7 py-14 lg:py-0">
            <TypewriterHeading />
            <p className="max-w-md text-base font-semibold leading-7 text-[#f4f0e6] sm:text-lg">
              Sharpen your problem-solving rhythm with focused practice and a workspace that keeps
              momentum visible.
            </p>
          </div>

          <div className="h-28 rounded-md border border-dashed border-[#d9ef69]/45 bg-[#405400]/35" />
        </div>
      </section>

      <section className="relative flex min-h-[56vh] items-center justify-center overflow-hidden bg-[#f4f0e6] px-5 py-8 sm:px-8 lg:min-h-screen">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(92,111,29,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(92,111,29,0.045)_1px,transparent_1px)] bg-[size:36px_36px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(217,239,105,0.22),transparent_32%),radial-gradient(circle_at_18%_82%,rgba(92,111,29,0.10),transparent_34%)]" />
        <div className="relative z-10 w-full max-w-md">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border border-[#33450e]/20 bg-[#5c6f1d] p-5 text-[#fffaf0] shadow-2xl shadow-[#10200d]/20 sm:p-6"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="mb-5 space-y-2 text-center">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d9ef69]">
                {mode === 'login' ? 'Login' : 'Sign up'}
              </p>
              <h2 className="text-2xl font-black tracking-normal text-[#fffaf0]">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-md border border-[#d9ef69]/25 bg-[#405400]/55 p-1">
              <button
                className={`rounded px-4 py-2 text-sm font-black transition ${
                  mode === 'login'
                    ? 'bg-[#d9ef69] text-[#10170d] shadow-sm shadow-[#10200d]/15'
                    : 'text-[#f4f0e6] hover:bg-[#33450e] hover:text-white'
                }`}
                onClick={() => switchMode('login')}
                type="button"
              >
                Login
              </button>
              <button
                className={`rounded px-4 py-2 text-sm font-black transition ${
                  mode === 'signup'
                    ? 'bg-[#d9ef69] text-[#10170d] shadow-sm shadow-[#10200d]/15'
                    : 'text-[#f4f0e6] hover:bg-[#33450e] hover:text-white'
                }`}
                onClick={() => switchMode('signup')}
                type="button"
              >
                Sign Up
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'login' ? (
                <motion.form
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: 8 }}
                  key="login"
                  noValidate
                  onSubmit={handleLoginSubmit}
                  transition={{ duration: 0.2 }}
                >
                  {loginErrors.server ? (
                    <div className="rounded-md border border-[#ffd2c5]/35 bg-[#7b2116]/35 px-3 py-2 text-sm font-semibold text-[#ffe0d8]">
                      {loginErrors.server}
                    </div>
                  ) : null}

                  <Field
                    autoComplete="username"
                    error={loginErrors.identifier}
                    icon={<Mail className="h-4 w-4" />}
                    label="Username / Email"
                    name="identifier"
                    onChange={(event) => {
                      setLoginForm((current) => ({ ...current, identifier: event.target.value }));
                      setLoginErrors((current) => ({ ...current, identifier: undefined, server: undefined }));
                    }}
                    placeholder="you@example.com"
                    type="text"
                    value={loginForm.identifier}
                  />
                  <Field
                    autoComplete="current-password"
                    endAdornment={
                      loginForm.password ? (
                        <PasswordToggle
                          isVisible={showLoginPassword}
                          onToggle={() => setShowLoginPassword((visible) => !visible)}
                        />
                      ) : null
                    }
                    error={loginErrors.password}
                    icon={<LockKeyhole className="h-4 w-4" />}
                    label="Password"
                    name="password"
                    onChange={(event) => {
                      setLoginForm((current) => ({ ...current, password: event.target.value }));
                      setLoginErrors((current) => ({ ...current, password: undefined, server: undefined }));
                    }}
                    placeholder="Enter your password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginForm.password}
                  />

                  <Button
                    className="h-11 w-full bg-[#d9ef69] font-black text-[#10170d] hover:bg-[#eef6bd]"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: 8 }}
                  key="signup"
                  noValidate
                  onSubmit={handleSignupSubmit}
                  transition={{ duration: 0.2 }}
                >
                  {signupErrors.server ? (
                    <div className="rounded-md border border-[#ffd2c5]/35 bg-[#7b2116]/35 px-3 py-2 text-sm font-semibold text-[#ffe0d8]">
                      {signupErrors.server}
                    </div>
                  ) : null}

                  <Field
                    autoComplete="username"
                    error={signupErrors.username}
                    icon={<UserRound className="h-4 w-4" />}
                    label="Username"
                    name="username"
                    onChange={(event) => {
                      setSignupForm((current) => ({ ...current, username: event.target.value }));
                      setSignupErrors((current) => ({ ...current, username: undefined, server: undefined }));
                    }}
                    placeholder="code_tutor"
                    type="text"
                    value={signupForm.username}
                  />
                  <Field
                    autoComplete="email"
                    error={signupErrors.email}
                    icon={<Mail className="h-4 w-4" />}
                    label="Email"
                    name="email"
                    onChange={(event) => {
                      setSignupForm((current) => ({ ...current, email: event.target.value }));
                      setSignupErrors((current) => ({ ...current, email: undefined, server: undefined }));
                    }}
                    placeholder="you@example.com"
                    type="email"
                    value={signupForm.email}
                  />
                  <Field
                    autoComplete="new-password"
                    endAdornment={
                      signupForm.password ? (
                        <PasswordToggle
                          isVisible={showSignupPassword}
                          onToggle={() => setShowSignupPassword((visible) => !visible)}
                        />
                      ) : null
                    }
                    error={signupErrors.password}
                    icon={<LockKeyhole className="h-4 w-4" />}
                    label="Password"
                    name="password"
                    onChange={(event) => {
                      setSignupForm((current) => ({ ...current, password: event.target.value }));
                      setSignupErrors((current) => ({ ...current, password: undefined, confirmPassword: undefined, server: undefined }));
                    }}
                    placeholder="At least 8 characters"
                    type={showSignupPassword ? 'text' : 'password'}
                    value={signupForm.password}
                  />
                  <Field
                    autoComplete="new-password"
                    endAdornment={
                      signupForm.confirmPassword ? (
                        <PasswordToggle
                          isVisible={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword((visible) => !visible)}
                        />
                      ) : null
                    }
                    error={signupErrors.confirmPassword}
                    icon={<LockKeyhole className="h-4 w-4" />}
                    label="Confirm Password"
                    name="confirmPassword"
                    onChange={(event) => {
                      setSignupForm((current) => ({ ...current, confirmPassword: event.target.value }));
                      setSignupErrors((current) => ({ ...current, confirmPassword: undefined, server: undefined }));
                    }}
                    placeholder="Confirm your password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={signupForm.confirmPassword}
                  />

                  <Button
                    className="h-11 w-full bg-[#d9ef69] font-black text-[#10170d] hover:bg-[#eef6bd]"
                    disabled={isLoading}
                    type="submit"
                  >
                    {isLoading ? 'Creating account...' : 'Sign Up'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
