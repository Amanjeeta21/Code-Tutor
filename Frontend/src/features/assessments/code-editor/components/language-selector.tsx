import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SupportedLanguage } from '../types/editor-types';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

const LANGUAGES: Record<SupportedLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
};

export function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  return (
    <Select
      value={selectedLanguage}
      onValueChange={(value) => onLanguageChange(value as SupportedLanguage)}
    >
      <SelectTrigger
        className="min-h-10 w-40 border-[#d8d0bb] bg-[#fffaf0]/60 text-xs font-semibold text-[#10170d] hover:border-[#a5bd3c]/40 hover:bg-[#fffaf0]/80"
        aria-label="Select editor language"
      >
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent className="border-[#d8d0bb] bg-[#fffaf0] text-[#10170d]">
        {(Object.keys(LANGUAGES) as SupportedLanguage[]).map((lang) => (
          <SelectItem key={lang} value={lang}>
            {LANGUAGES[lang]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

