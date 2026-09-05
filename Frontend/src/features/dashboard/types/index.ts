export interface UserStats {
  currentStreak: number;
  problemsSolved: number;
  skillRank: string;
  accuracyRate: number;
}

export interface ContributionDay {
  date: string;
  count: number;
}

export interface Submission {
  id: string;
  title: string;
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded';
  time: string;
  language: string;
}