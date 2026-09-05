import { generateActivityGrid, mockSubmissions } from '../data/dashboard-data';
import type { UserStats, ContributionDay, Submission } from '../types';

export async function fetchUserStats(): Promise<UserStats> {
  return {
    currentStreak: 0,
    problemsSolved: 0,
    skillRank: '0',
    accuracyRate: 0,
  };
}

export async function fetchActivityData(): Promise<ContributionDay[]> {
  return generateActivityGrid();
}

export async function fetchRecentSubmissions(): Promise<Submission[]> {
  return mockSubmissions;
}
