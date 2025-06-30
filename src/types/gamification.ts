export interface UserGameStats {
  level: number;
  currentXP: number;
  totalXP: number;
  coins: number;
  achievements: string[];
  dailyStreak: number;
  lastLoginDate: string;
  weeklyChallenge: WeeklyChallenge | null;
  dailyChallenge: DailyChallenge | null;
  stats: UserStats;
  combo: ComboData;
}

export interface UserStats {
  totalScans: number;
  totalSavings: number;
  perfectWeeks: number;
  completedLists: number;
  manualPriceEntries: number;
  budgetSuccesses: number;
  averageSavingsPerTrip: number;
  biggestSaving: number;
  totalTrips: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requirement: number;
  currentProgress: number;
  completed: boolean;
  unlockedAt?: string;
  xpReward: number;
  coinReward: number;
  type: AchievementType;
}

export type AchievementType = 
  | 'first_scan'
  | 'savings'
  | 'streak'
  | 'scans'
  | 'budget'
  | 'level'
  | 'special';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  currentProgress: number;
  completed: boolean;
  date: string;
  xpReward: number;
  coinReward: number;
  emoji: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  target: number;
  currentProgress: number;
  completed: boolean;
  weekStart: string;
  weekEnd: string;
  xpReward: number;
  coinReward: number;
  emoji: string;
}

export type ChallengeType = 
  | 'scan_products'
  | 'save_money'
  | 'complete_lists'
  | 'stay_under_budget'
  | 'add_manual_prices'
  | 'use_app_daily';

export interface ComboData {
  count: number;
  multiplier: number;
  lastActionTime: number;
  isActive: boolean;
}

export interface XPAction {
  type: XPActionType;
  baseXP: number;
  description: string;
}

export type XPActionType =
  | 'scan_product'
  | 'complete_list'
  | 'under_budget'
  | 'manual_price'
  | 'daily_streak'
  | 'achievement_unlock'
  | 'challenge_complete';

export interface LevelUpData {
  newLevel: number;
  xpGained: number;
  coinsGained: number;
  unlocks: string[];
}

export interface GameEvent {
  type: GameEventType;
  data: any;
  timestamp: number;
}

export type GameEventType =
  | 'xp_gained'
  | 'level_up'
  | 'achievement_unlocked'
  | 'challenge_completed'
  | 'combo_increased'
  | 'coins_gained';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
  type: StoreItemType;
  unlockLevel: number;
  owned: boolean;
}

export type StoreItemType =
  | 'theme'
  | 'icon'
  | 'badge'
  | 'feature';

export interface LeaderboardEntry {
  userId: string;
  username: string;
  level: number;
  totalXP: number;
  totalSavings: number;
  avatar: string;
  rank: number;
}

// Constants
export const XP_REWARDS: Record<XPActionType, number> = {
  scan_product: 10,
  complete_list: 50,
  under_budget: 100,
  manual_price: 15,
  daily_streak: 20,
  achievement_unlock: 25,
  challenge_complete: 0, // Varies by challenge
};

export const LEVEL_XP_REQUIREMENTS = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, // 1-10
  3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, // 11-20
  11500, 12600, 13750, 14950, 16200, 17500, 18850, 20250, 21700, 23200, // 21-30
  24750, 26350, 28000, 29700, 31450, 33250, 35100, 37000, 38950, 40950, // 31-40
  43000, 45100, 47250, 49450, 51700, 54000, 56350, 58750, 61200, 63700 // 41-50
];

export const COMBO_TIMEOUT = 30000; // 30 seconds
export const MAX_COMBO_MULTIPLIER = 5;