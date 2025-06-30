import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserGameStats, Achievement, DailyChallenge, WeeklyChallenge } from '../types/gamification';

const GAME_STATS_KEY = '@SuperCompras:gameStats';
const ACHIEVEMENTS_KEY = '@SuperCompras:achievements';
const DAILY_CHALLENGE_KEY = '@SuperCompras:dailyChallenge';
const WEEKLY_CHALLENGE_KEY = '@SuperCompras:weeklyChallenge';

const DEFAULT_GAME_STATS: UserGameStats = {
  level: 1,
  currentXP: 0,
  totalXP: 0,
  coins: 50, // Start with some coins
  achievements: [],
  dailyStreak: 0,
  lastLoginDate: new Date().toISOString(),
  weeklyChallenge: null,
  dailyChallenge: null,
  stats: {
    totalScans: 0,
    totalSavings: 0,
    perfectWeeks: 0,
    completedLists: 0,
    manualPriceEntries: 0,
    budgetSuccesses: 0,
    averageSavingsPerTrip: 0,
    biggestSaving: 0,
    totalTrips: 0,
  },
  combo: {
    count: 0,
    multiplier: 1,
    lastActionTime: 0,
    isActive: false,
  },
};

export const GameStorage = {
  // Game Stats
  async getGameStats(): Promise<UserGameStats> {
    try {
      const data = await AsyncStorage.getItem(GAME_STATS_KEY);
      if (data) {
        const stats = JSON.parse(data);
        // Merge with defaults to ensure all properties exist
        return { ...DEFAULT_GAME_STATS, ...stats };
      }
      return DEFAULT_GAME_STATS;
    } catch (error) {
      console.error('Error getting game stats:', error);
      return DEFAULT_GAME_STATS;
    }
  },

  async saveGameStats(stats: UserGameStats): Promise<void> {
    try {
      await AsyncStorage.setItem(GAME_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving game stats:', error);
      throw error;
    }
  },

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    try {
      const data = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  },

  async saveAchievements(achievements: Achievement[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    } catch (error) {
      console.error('Error saving achievements:', error);
      throw error;
    }
  },

  async unlockAchievement(achievementId: string): Promise<void> {
    try {
      const achievements = await this.getAchievements();
      const achievement = achievements.find(a => a.id === achievementId);
      
      if (achievement && !achievement.completed) {
        achievement.completed = true;
        achievement.unlockedAt = new Date().toISOString();
        await this.saveAchievements(achievements);
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  },

  // Daily Challenge
  async getDailyChallenge(): Promise<DailyChallenge | null> {
    try {
      const data = await AsyncStorage.getItem(DAILY_CHALLENGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting daily challenge:', error);
      return null;
    }
  },

  async saveDailyChallenge(challenge: DailyChallenge): Promise<void> {
    try {
      await AsyncStorage.setItem(DAILY_CHALLENGE_KEY, JSON.stringify(challenge));
    } catch (error) {
      console.error('Error saving daily challenge:', error);
      throw error;
    }
  },

  async clearDailyChallenge(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DAILY_CHALLENGE_KEY);
    } catch (error) {
      console.error('Error clearing daily challenge:', error);
      throw error;
    }
  },

  // Weekly Challenge
  async getWeeklyChallenge(): Promise<WeeklyChallenge | null> {
    try {
      const data = await AsyncStorage.getItem(WEEKLY_CHALLENGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting weekly challenge:', error);
      return null;
    }
  },

  async saveWeeklyChallenge(challenge: WeeklyChallenge): Promise<void> {
    try {
      await AsyncStorage.setItem(WEEKLY_CHALLENGE_KEY, JSON.stringify(challenge));
    } catch (error) {
      console.error('Error saving weekly challenge:', error);
      throw error;
    }
  },

  async clearWeeklyChallenge(): Promise<void> {
    try {
      await AsyncStorage.removeItem(WEEKLY_CHALLENGE_KEY);
    } catch (error) {
      console.error('Error clearing weekly challenge:', error);
      throw error;
    }
  },

  // Utility functions
  async incrementStat(statName: keyof UserGameStats['stats'], amount: number = 1): Promise<void> {
    try {
      const stats = await this.getGameStats();
      (stats.stats[statName] as number) += amount;
      await this.saveGameStats(stats);
    } catch (error) {
      console.error('Error incrementing stat:', error);
      throw error;
    }
  },

  async updateStat(statName: keyof UserGameStats['stats'], value: number): Promise<void> {
    try {
      const stats = await this.getGameStats();
      (stats.stats[statName] as number) = value;
      await this.saveGameStats(stats);
    } catch (error) {
      console.error('Error updating stat:', error);
      throw error;
    }
  },

  // Backup and restore
  async exportGameData(): Promise<string> {
    try {
      const [gameStats, achievements, dailyChallenge, weeklyChallenge] = await Promise.all([
        this.getGameStats(),
        this.getAchievements(),
        this.getDailyChallenge(),
        this.getWeeklyChallenge(),
      ]);

      const exportData = {
        gameStats,
        achievements,
        dailyChallenge,
        weeklyChallenge,
        exportedAt: new Date().toISOString(),
      };

      return JSON.stringify(exportData);
    } catch (error) {
      console.error('Error exporting game data:', error);
      throw error;
    }
  },

  async importGameData(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);
      
      await Promise.all([
        this.saveGameStats(importData.gameStats || DEFAULT_GAME_STATS),
        this.saveAchievements(importData.achievements || []),
        importData.dailyChallenge ? this.saveDailyChallenge(importData.dailyChallenge) : this.clearDailyChallenge(),
        importData.weeklyChallenge ? this.saveWeeklyChallenge(importData.weeklyChallenge) : this.clearWeeklyChallenge(),
      ]);
    } catch (error) {
      console.error('Error importing game data:', error);
      throw error;
    }
  },

  // Clear all data
  async clearAllGameData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(GAME_STATS_KEY),
        AsyncStorage.removeItem(ACHIEVEMENTS_KEY),
        AsyncStorage.removeItem(DAILY_CHALLENGE_KEY),
        AsyncStorage.removeItem(WEEKLY_CHALLENGE_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing all game data:', error);
      throw error;
    }
  },
};