import { createFileRoute, Link } from '@tanstack/react-router';
import { motion, type Variants } from 'framer-motion';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Code2,
  Fingerprint,
  ImagePlus,
  Mail,
  Pencil,
  ShieldCheck,
  UserRound,
  VenusAndMars,
  X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';

import { TopNavigation } from '@/components/common/top-navigation';
import { useAuth, type ProfileUpdate } from '@/features/authentication';
import { cn } from '@/lib/utils';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const editorLanguageOptions = ['JavaScript', 'TypeScript', 'Java', 'Python', 'C++'];
const genderOptions = ['Male', 'Female', 'Does not want to disclose'];

const roleSuggestions = [
  'Student',
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'Coder',
  'Competitive Programmer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Mobile Developer',
  'Game Developer',
  'DevOps Engineer',
  'QA Engineer',
  'Product Manager',
  'Teacher',
  'Mentor',
  'Freelancer',
  'Founder',
];

const spokenLanguageOptions = [
  'English', 'Hindi', 'Spanish', 'French', 'German', 'Mandarin Chinese', 'Arabic', 'Bengali',
  'Portuguese', 'Russian', 'Japanese', 'Korean', 'Italian', 'Urdu', 'Indonesian', 'Turkish',
  'Vietnamese', 'Tamil', 'Telugu', 'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Punjabi',
  'Thai', 'Dutch', 'Greek', 'Polish', 'Ukrainian', 'Romanian', 'Czech', 'Hungarian', 'Swedish',
  'Norwegian', 'Danish', 'Finnish', 'Hebrew', 'Persian', 'Swahili', 'Malay', 'Filipino',
  'Chinese Cantonese', 'Hausa', 'Yoruba', 'Igbo', 'Zulu', 'Afrikaans', 'Nepali', 'Sinhala',
  'Burmese', 'Khmer', 'Lao', 'Mongolian', 'Serbian', 'Croatian', 'Bulgarian', 'Slovak',
];

type ProfileForm = {
  bio: string;
  dateOfBirth: string;
  editorLanguage: string;
  email: string;
  fullName: string;
  gender: string;
  image: string;
  language: string;
  role: string;
  username: string;
};

const formatDate = (value?: string) => {
  if (!value) return 'Not available';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';

  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

function getInitials(name?: string) {
  if (!name?.trim()) return 'CT';

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function toProfileForm(user: ReturnType<typeof useAuth>['user']): ProfileForm {
  return {
    bio: user?.bio ?? '',
    dateOfBirth: user?.dateOfBirth ?? '',
    editorLanguage: user?.editorLanguage ?? 'JavaScript',
    email: user?.email ?? '',
    fullName: user?.fullName ?? user?.username ?? '',
    gender: user?.gender ?? 'Does not want to disclose',
    image: user?.image ?? '',
    language: user?.language ?? '',
    role: user?.role ?? 'Student',
    username: user?.username ?? '',
  };
}

function AccountPage() {
  const { user, isLoading, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>(() => toProfileForm(user));
  const [formError, setFormError] = useState('');
  const [formStatus, setFormStatus] = useState('');

  useEffect(() => {
    if (!isEditing) setForm(toProfileForm(user));
  }, [isEditing, user]);

  const displayName = user?.fullName?.trim() || user?.username?.trim() || 'Code Tutor Learner';
  const username = user?.username?.trim() || 'No username added';
  const email = user?.email?.trim() || 'No email available';
  const role = user?.role?.trim() || 'Student';
  const gender = user?.gender?.trim() || 'Does not want to disclose';
  const dateOfBirth = user?.dateOfBirth?.trim() || 'Not added';
  const preferredLanguage = user?.language?.trim() || 'Not selected';
  const editorLanguage = user?.editorLanguage?.trim() || 'JavaScript';
  const bio = user?.bio?.trim() || 'No bio added yet.';
  const joinedAt = formatDate(user?.createdAt);
  const initials = getInitials(displayName);

  const profileStats = [
    { label: 'Solved', value: '0', helper: 'Problems completed' },
    { label: 'Accuracy', value: '0%', helper: 'Accepted attempts' },
    { label: 'Streak', value: '0', helper: 'Active days' },
  ];

  const accountDetails = [
    { label: 'Full Name', value: displayName, icon: UserRound },
    { label: 'Username', value: username, icon: UserRound },
    { label: 'Email', value: email, icon: Mail },
    { label: 'Role', value: role, icon: ShieldCheck },
    { label: 'Gender', value: gender, icon: VenusAndMars },
    { label: 'Date of Birth', value: dateOfBirth, icon: CalendarDays },
    { label: 'Joined', value: joinedAt, icon: CalendarDays },
    { label: 'Account ID', value: user?.id || 'Not available', icon: Fingerprint },
  ];

  const handleChange =
    (field: keyof ProfileForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setFormError('');
      setFormStatus('');
    };

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Choose an image file for your profile picture.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, image: String(reader.result || '') }));
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  const startEditing = () => {
    setForm(toProfileForm(user));
    setFormError('');
    setFormStatus('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setForm(toProfileForm(user));
    setFormError('');
    setIsEditing(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFormError('');
    setFormStatus('');

    try {
      const payload: ProfileUpdate = {
        bio: form.bio,
        dateOfBirth: form.dateOfBirth,
        editorLanguage: form.editorLanguage,
        email: form.email,
        fullName: form.fullName,
        gender: form.gender,
        image: form.image,
        language: form.language,
        role: form.role,
        username: form.username,
      };

      await updateProfile(payload);
      setFormStatus('Profile updated.');
      setIsEditing(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to update your profile right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f0e6] font-sans text-[#10170d] antialiased">
      <TopNavigation activeTab="profile" />

      <main className="relative z-10 ml-[var(--app-sidebar-width,5rem)] max-w-[1180px] px-4 pb-24 pt-8 transition-[margin] duration-300 sm:px-6 lg:px-8">
        {isLoading ? <Notice>Loading account...</Notice> : null}
        {formStatus ? <Notice tone="success">{formStatus}</Notice> : null}

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
          <motion.section variants={itemVariants} className="overflow-hidden rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] shadow-xl shadow-[#10200d]/10">
            <div className="flex flex-col gap-5 border-b border-[#d8d0bb] bg-[#ece5d5]/75 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar image={user?.image} initials={initials} name={displayName} />
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#a5bd3c]/45 bg-[#e8f2ad] px-3 py-1 text-[10px] font-black uppercase text-[#405400]">
                    <BadgeCheck className="h-3.5 w-3.5" /> Account
                  </div>
                  <h1 className="text-3xl font-black tracking-normal text-[#10170d] sm:text-4xl">{displayName}</h1>
                  <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-[#514b3d]">{role}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <IconButton label="Edit profile" onClick={startEditing} />
                <Link to="/practice" viewTransition className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a5bd3c] px-4 py-2.5 text-xs font-black text-[#10170d] shadow-sm shadow-[#10200d]/10 transition hover:bg-[#bdd45a]">
                  Continue Practice
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-px bg-[#d8d0bb] sm:grid-cols-3">
              {profileStats.map((item) => (
                <div key={item.label} className="bg-[#fffaf0] p-5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#8a836f]">{item.label}</p>
                  <p className="mt-2 text-3xl font-black text-[#10170d]">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold text-[#514b3d]">{item.helper}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-5">
              <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
                <SectionHeader icon={UserRound} title="Profile Details" onEdit={startEditing} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {accountDetails.map((item) => {
                    const Icon = item.icon;
                    return <DetailCard key={item.label} icon={Icon} label={item.label} value={item.value} />;
                  })}
                </div>
              </motion.section>

              <motion.section variants={itemVariants} className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
                <SectionHeader icon={BadgeCheck} title="Bio" onEdit={startEditing} />
                <p className="rounded-xl border border-[#d8d0bb] bg-[#f8f4ea] p-4 text-sm font-semibold leading-7 text-[#514b3d]">{bio}</p>
              </motion.section>
            </div>

            <motion.aside variants={itemVariants} className="space-y-5">
              <section className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
                <div className="mb-4 flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-[#5c6f1d]" />
                  <h2 className="text-sm font-black text-[#10170d]">Learning Setup</h2>
                </div>
                <div className="space-y-3">
                  <StatusRow label="Editor language" value={editorLanguage} />
                  <StatusRow label="Preferred language" value={preferredLanguage} />
                  <StatusRow label="Practice track" value="Core DSA" />
                </div>
              </section>

              <section className="rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-lg shadow-[#10200d]/5">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#5c6f1d]" />
                  <h2 className="text-sm font-black text-[#10170d]">Account State</h2>
                </div>
                <div className="rounded-xl border border-[#a5bd3c]/45 bg-[#e8f2ad] p-4">
                  <p className="text-xs font-black uppercase text-[#405400]">Signed in</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-[#514b3d]">Your session is active and profile edits are saved to your account.</p>
                </div>
              </section>
            </motion.aside>
          </div>
        </motion.div>
      </main>

      {isEditing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10170d]/45 px-4 py-6 backdrop-blur-sm">
          <motion.form animate={{ opacity: 1, y: 0 }} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#d8d0bb] bg-[#fffaf0] p-5 shadow-2xl shadow-[#10200d]/25" initial={{ opacity: 0, y: 14 }} onSubmit={handleSubmit}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-[#10170d]">Edit Profile</h2>
                <p className="text-xs font-semibold text-[#8a836f]">Account ID stays read-only: {user?.id || 'Not available'}</p>
              </div>
              <button aria-label="Cancel editing" className="grid h-9 w-9 place-items-center rounded-lg border border-[#d8d0bb] text-[#514b3d] transition hover:bg-[#f4f0e6]" onClick={cancelEditing} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError ? <div className="mb-4 rounded-lg border border-[#c46f5f]/40 bg-[#7b2116]/10 px-3 py-2 text-sm font-bold text-[#7b2116]">{formError}</div> : null}

            <div className="mb-5 flex flex-col gap-4 rounded-xl border border-[#d8d0bb] bg-[#f8f4ea] p-4 sm:flex-row sm:items-center">
              <Avatar image={form.image} initials={getInitials(form.fullName || form.username)} name={form.fullName || form.username || 'Profile preview'} />
              <div className="min-w-0 flex-1 space-y-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#a5bd3c]/45 bg-[#fffaf0] px-3 py-2 text-xs font-black text-[#405400] transition hover:bg-[#e8f2ad]">
                  <ImagePlus className="h-4 w-4" />
                  Profile Picture
                  <input accept="image/*" className="sr-only" onChange={handleImageFile} type="file" />
                </label>
                <EditField label="Profile Picture URL" value={form.image.startsWith('data:') ? '' : form.image} onChange={handleChange('image')} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EditField label="Full Name" value={form.fullName} onChange={handleChange('fullName')} />
              <EditField label="Username" value={form.username} onChange={handleChange('username')} />
              <EditField label="Email" type="email" value={form.email} onChange={handleChange('email')} />
              <EditField label="Role" list="role-options" value={form.role} onChange={handleChange('role')} />
              <SelectField label="Gender" value={form.gender} onChange={handleChange('gender')} options={genderOptions} />
              <EditField label="Date of Birth" placeholder="dd-mm-yyyy" value={form.dateOfBirth} onChange={handleChange('dateOfBirth')} />
              <SelectField label="Editor Language" value={form.editorLanguage} onChange={handleChange('editorLanguage')} options={editorLanguageOptions} />
              <EditField label="Preferred Spoken Language" list="spoken-language-options" value={form.language} onChange={handleChange('language')} />
              <label className="block space-y-2 sm:col-span-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8a836f]">Bio</span>
                <textarea className="min-h-24 w-full resize-y rounded-lg border border-[#d8d0bb] bg-[#f8f4ea] px-3 py-2 text-sm font-semibold text-[#10170d] outline-none transition focus:border-[#a5bd3c] focus:ring-2 focus:ring-[#a5bd3c]/20" maxLength={280} onChange={handleChange('bio')} value={form.bio} />
              </label>
            </div>

            <datalist id="role-options">
              {roleSuggestions.map((item) => <option key={item} value={item} />)}
            </datalist>
            <datalist id="spoken-language-options">
              {spokenLanguageOptions.map((item) => <option key={item} value={item} />)}
            </datalist>

            <div className="mt-5 flex justify-end gap-2">
              <button className="inline-flex items-center gap-2 rounded-lg border border-[#d8d0bb] bg-[#fffaf0] px-4 py-2 text-xs font-black text-[#514b3d] transition hover:bg-[#f4f0e6]" onClick={cancelEditing} type="button">
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#a5bd3c] px-4 py-2 text-xs font-black text-[#10170d] transition hover:bg-[#bdd45a] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} type="submit">
                <Check className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </motion.form>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ image, initials, name }: { image?: string; initials: string; name: string }) {
  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[#a5bd3c]/50 bg-[#e8f2ad] shadow-sm shadow-[#10200d]/10">
      {image ? <img src={image} alt={name} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-3xl font-black text-[#405400]">{initials}</div>}
    </div>
  );
}

function DetailCard({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#d8d0bb] bg-[#f8f4ea] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f2ad] text-[#405400]"><Icon className="h-4 w-4" /></div>
      <p className="text-[10px] font-black uppercase tracking-wider text-[#8a836f]">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-[#10170d]">{value}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, onEdit, title }: { icon: typeof UserRound; onEdit: () => void; title: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-[#5c6f1d]" />
        <h2 className="text-sm font-black text-[#10170d]">{title}</h2>
      </div>
      <IconButton label={`Edit ${title.toLowerCase()}`} onClick={onEdit} size="sm" />
    </div>
  );
}

function IconButton({ label, onClick, size = 'md' }: { label: string; onClick: () => void; size?: 'sm' | 'md' }) {
  return (
    <button aria-label={label} className={cn('inline-flex items-center justify-center rounded-lg border border-[#a5bd3c]/45 bg-[#fffaf0] text-[#405400] shadow-sm shadow-[#10200d]/10 transition hover:bg-[#e8f2ad]', size === 'sm' ? 'h-9 w-9' : 'h-10 w-10')} onClick={onClick} type="button">
      <Pencil className="h-4 w-4" />
    </button>
  );
}

function Notice({ children, tone = 'neutral' }: { children: string; tone?: 'neutral' | 'success' }) {
  return <div className={cn('mb-5 rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm shadow-[#10200d]/5', tone === 'success' ? 'border-[#a5bd3c]/50 bg-[#e8f2ad] text-[#405400]' : 'border-[#d8d0bb] bg-[#fffaf0] text-[#514b3d]')}>{children}</div>;
}

function EditField({ className, label, list, onChange, placeholder, type = 'text', value }: { className?: string; label: string; list?: string; onChange: (event: ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string; value: string }) {
  return (
    <label className={cn('block space-y-2', className)}>
      <span className="text-[10px] font-black uppercase tracking-wider text-[#8a836f]">{label}</span>
      <input className="h-11 w-full rounded-lg border border-[#d8d0bb] bg-[#f8f4ea] px-3 text-sm font-semibold text-[#10170d] outline-none transition focus:border-[#a5bd3c] focus:ring-2 focus:ring-[#a5bd3c]/20" list={list} onChange={onChange} placeholder={placeholder} type={type} value={value} />
    </label>
  );
}

function SelectField({ label, onChange, options, value }: { label: string; onChange: (event: ChangeEvent<HTMLSelectElement>) => void; options: string[]; value: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-wider text-[#8a836f]">{label}</span>
      <select className="h-11 w-full rounded-lg border border-[#d8d0bb] bg-[#f8f4ea] px-3 text-sm font-semibold text-[#10170d] outline-none transition focus:border-[#a5bd3c] focus:ring-2 focus:ring-[#a5bd3c]/20" onChange={onChange} value={value}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#d8d0bb] bg-[#f8f4ea] px-4 py-3">
      <span className="text-xs font-bold text-[#514b3d]">{label}</span>
      <span className={cn('text-right text-xs font-black text-[#10170d]', value === 'Not selected' && 'text-[#8a836f]')}>{value}</span>
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/profile')({
  component: AccountPage,
});