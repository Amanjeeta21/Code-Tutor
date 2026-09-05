import type { ContributionDay, Submission } from '../types';

export const generateActivityGrid = (): ContributionDay[] => {
  const days: ContributionDay[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      count: 0,
    });
  }
  return days;
};

export const mockSubmissions: Submission[] = [];
