import * as Haptics from 'expo-haptics';
import { 
  UserGameStats, 
  Achievement, 
  DailyChallenge, 
  WeeklyChallenge, 
  XPActionType, 
  XP_REWARDS, 
  LEVEL_XP_REQUIREMENTS,
  LevelUpData,
  GameEvent,
  COMBO_TIMEOUT,
  MAX_COMBO_MULTIPLIER,
  ChallengeType
} from '../types/gamification';
import { GameStorage } from './gameStorage';

export class GameManager {
  private eventListeners: ((event: GameEvent) => void)[] = [];
  private comboTimer: NodeJS.Timeout | null = null;

  // Event system
  addEventListener(listener: (event: GameEvent) => void) {
    this.eventListeners.push(listener);
  }

  removeEventListener(listener: (event: GameEvent) => void) {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  private emitEvent(type: GameEvent['type'], data: any) {
    const event: GameEvent = {
      type,
      data,
      timestamp: Date.now(),
    };
    
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in game event listener:', error);
      }
    });
  }

  // XP and Level Management
  async addXP(actionType: XPActionType, customAmount?: number): Promise<LevelUpData | null> {
    try {
      const stats = await GameStorage.getGameStats();
      const baseXP = customAmount || XP_REWARDS[actionType];
      
      // Apply combo multiplier
      const comboMultiplier = stats.combo.isActive ? stats.combo.multiplier : 1;
      const finalXP = Math.floor(baseXP * comboMultiplier);
      
      stats.currentXP += finalXP;
      stats.totalXP += finalXP;

      // Check for level up
      const levelUpData = this.checkLevelUp(stats);
      
      await GameStorage.saveGameStats(stats);
      
      // Emit XP gained event
      this.emitEvent('xp_gained', { 
        actionType, 
        xpGained: finalXP, 
        comboMultiplier 
      });

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      return levelUpData;
    } catch (error) {
      console.error('Error adding XP:', error);
      return null;
    }
  }

  private checkLevelUp(stats: UserGameStats): LevelUpData | null {
    const currentLevel = stats.level;
    const newLevel = this.calculateLevel(stats.totalXP);
    
    if (newLevel > currentLevel) {
      stats.level = newLevel;
      stats.currentXP = stats.totalXP - LEVEL_XP_REQUIREMENTS[newLevel - 1];
      
      // Calculate coins gained (10 coins per level)
      const coinsGained = (newLevel - currentLevel) * 10;
      stats.coins += coinsGained;
      
      const levelUpData: LevelUpData = {
        newLevel,
        xpGained: 0, // This is handled separately
        coinsGained,
        unlocks: this.getLevelUnlocks(newLevel),
      };

      // Emit level up event
      this.emitEvent('level_up', levelUpData);
      
      // Strong haptic feedback for level up
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      return levelUpData;
    }

    return null;
  }

  private calculateLevel(totalXP: number): number {
    for (let level = 1; level < LEVEL_XP_REQUIREMENTS.length; level++) {
      if (totalXP < LEVEL_XP_REQUIREMENTS[level]) {
        return level;
      }
    }
    return LEVEL_XP_REQUIREMENTS.length; // Max level
  }

  private getLevelUnlocks(level: number): string[] {
    const unlocks: string[] = [];
    
    // Add unlocks based on level
    if (level === 5) unlocks.push('Desafios Semanais');
    if (level === 10) unlocks.push('Sistema de Combos');
    if (level === 15) unlocks.push('Loja de Temas');
    if (level === 20) unlocks.push('Estatísticas Avançadas');
    if (level === 25) unlocks.push('Compartilhamento Social');
    if (level === 30) unlocks.push('Ranking com Amigos');
    
    return unlocks;
  }

  // Combo System
  async updateCombo(): Promise<void> {
    try {
      const stats = await GameStorage.getGameStats();
      const now = Date.now();
      
      // Check if combo should continue
      if (stats.combo.isActive && (now - stats.combo.lastActionTime) <= COMBO_TIMEOUT) {
        stats.combo.count++;
        stats.combo.multiplier = Math.min(
          Math.floor(stats.combo.count / 3) + 1,
          MAX_COMBO_MULTIPLIER
        );
      } else {
        // Start new combo
        stats.combo.count = 1;
        stats.combo.multiplier = 1;
        stats.combo.isActive = true;
      }
      
      stats.combo.lastActionTime = now;
      
      await GameStorage.saveGameStats(stats);
      
      // Reset combo timer
      if (this.comboTimer) {
        clearTimeout(this.comboTimer);
      }
      
      // Set new timer to end combo
      this.comboTimer = setTimeout(async () => {
        await this.endCombo();
      }, COMBO_TIMEOUT);

      // Emit combo event
      this.emitEvent('combo_increased', {
        count: stats.combo.count,
        multiplier: stats.combo.multiplier,
      });

    } catch (error) {
      console.error('Error updating combo:', error);
    }
  }

  private async endCombo(): Promise<void> {
    try {
      const stats = await GameStorage.getGameStats();
      stats.combo.isActive = false;
      stats.combo.count = 0;
      stats.combo.multiplier = 1;
      await GameStorage.saveGameStats(stats);
    } catch (error) {
      console.error('Error ending combo:', error);
    }
  }

  // Achievement System
  async checkAchievements(): Promise<Achievement[]> {
    try {
      const [stats, achievements] = await Promise.all([
        GameStorage.getGameStats(),
        GameStorage.getAchievements(),
      ]);

      const newlyUnlocked: Achievement[] = [];

      for (const achievement of achievements) {
        if (!achievement.completed && this.checkAchievementCondition(achievement, stats)) {
          achievement.completed = true;
          achievement.unlockedAt = new Date().toISOString();
          newlyUnlocked.push(achievement);

          // Add XP and coins reward
          await this.addXP('achievement_unlock', achievement.xpReward);
          stats.coins += achievement.coinReward;

          // Emit achievement unlocked event
          this.emitEvent('achievement_unlocked', achievement);
          
          // Haptic feedback
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }

      if (newlyUnlocked.length > 0) {
        await Promise.all([
          GameStorage.saveAchievements(achievements),
          GameStorage.saveGameStats(stats),
        ]);
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  private checkAchievementCondition(achievement: Achievement, stats: UserGameStats): boolean {
    switch (achievement.type) {
      case 'first_scan':
        return stats.stats.totalScans >= 1;
      case 'savings':
        return stats.stats.totalSavings >= achievement.requirement;
      case 'streak':
        return stats.dailyStreak >= achievement.requirement;
      case 'scans':
        return stats.stats.totalScans >= achievement.requirement;
      case 'budget':
        return stats.stats.budgetSuccesses >= achievement.requirement;
      case 'level':
        return stats.level >= achievement.requirement;
      default:
        return false;
    }
  }

  // Challenge System
  async updateChallengeProgress(type: ChallengeType, amount: number = 1): Promise<void> {
    try {
      const [dailyChallenge, weeklyChallenge] = await Promise.all([
        GameStorage.getDailyChallenge(),
        GameStorage.getWeeklyChallenge(),
      ]);

      // Update daily challenge
      if (dailyChallenge && !dailyChallenge.completed && dailyChallenge.type === type) {
        dailyChallenge.currentProgress += amount;
        
        if (dailyChallenge.currentProgress >= dailyChallenge.target) {
          dailyChallenge.completed = true;
          await this.completeDailyChallenge(dailyChallenge);
        } else {
          await GameStorage.saveDailyChallenge(dailyChallenge);
        }
      }

      // Update weekly challenge
      if (weeklyChallenge && !weeklyChallenge.completed && weeklyChallenge.type === type) {
        weeklyChallenge.currentProgress += amount;
        
        if (weeklyChallenge.currentProgress >= weeklyChallenge.target) {
          weeklyChallenge.completed = true;
          await this.completeWeeklyChallenge(weeklyChallenge);
        } else {
          await GameStorage.saveWeeklyChallenge(weeklyChallenge);
        }
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
    }
  }

  private async completeDailyChallenge(challenge: DailyChallenge): Promise<void> {
    try {
      // Award XP and coins
      await this.addXP('challenge_complete', challenge.xpReward);
      
      const stats = await GameStorage.getGameStats();
      stats.coins += challenge.coinReward;
      await GameStorage.saveGameStats(stats);
      
      await GameStorage.saveDailyChallenge(challenge);
      
      // Emit challenge completed event
      this.emitEvent('challenge_completed', { type: 'daily', challenge });
      
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error completing daily challenge:', error);
    }
  }

  private async completeWeeklyChallenge(challenge: WeeklyChallenge): Promise<void> {
    try {
      // Award XP and coins
      await this.addXP('challenge_complete', challenge.xpReward);
      
      const stats = await GameStorage.getGameStats();
      stats.coins += challenge.coinReward;
      await GameStorage.saveGameStats(stats);
      
      await GameStorage.saveWeeklyChallenge(challenge);
      
      // Emit challenge completed event
      this.emitEvent('challenge_completed', { type: 'weekly', challenge });
      
      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error completing weekly challenge:', error);
    }
  }

  // Daily Streak
  async updateDailyStreak(): Promise<void> {
    try {
      const stats = await GameStorage.getGameStats();
      const today = new Date().toDateString();
      const lastLogin = new Date(stats.lastLoginDate).toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      if (lastLogin === today) {
        // Already logged in today, no change
        return;
      } else if (lastLogin === yesterday) {
        // Consecutive day, increment streak
        stats.dailyStreak++;
        await this.addXP('daily_streak');
      } else {
        // Streak broken, reset to 1
        stats.dailyStreak = 1;
      }

      stats.lastLoginDate = new Date().toISOString();
      await GameStorage.saveGameStats(stats);
    } catch (error) {
      console.error('Error updating daily streak:', error);
    }
  }

  // Action handlers for specific app events
  async onProductScanned(): Promise<void> {
    await Promise.all([
      this.addXP('scan_product'),
      this.updateCombo(),
      GameStorage.incrementStat('totalScans'),
      this.updateChallengeProgress('scan_products'),
    ]);
    await this.checkAchievements();
  }

  async onListCompleted(totalAmount: number, budgetAmount?: number): Promise<void> {
    const isUnderBudget = budgetAmount ? totalAmount <= budgetAmount : false;
    
    await Promise.all([
      this.addXP('complete_list'),
      GameStorage.incrementStat('completedLists'),
      this.updateChallengeProgress('complete_lists'),
    ]);

    if (isUnderBudget && budgetAmount) {
      const savings = budgetAmount - totalAmount;
      await Promise.all([
        this.addXP('under_budget'),
        GameStorage.incrementStat('budgetSuccesses'),
        GameStorage.incrementStat('totalSavings', savings),
        this.updateChallengeProgress('stay_under_budget'),
        this.updateChallengeProgress('save_money', savings),
      ]);

      // Update biggest saving if applicable
      const stats = await GameStorage.getGameStats();
      if (savings > stats.stats.biggestSaving) {
        await GameStorage.updateStat('biggestSaving', savings);
      }
    }

    await this.checkAchievements();
  }

  async onManualPriceEntry(): Promise<void> {
    await Promise.all([
      this.addXP('manual_price'),
      GameStorage.incrementStat('manualPriceEntries'),
      this.updateChallengeProgress('add_manual_prices'),
    ]);
    await this.checkAchievements();
  }

  // Utility methods
  async spendCoins(amount: number): Promise<boolean> {
    try {
      const stats = await GameStorage.getGameStats();
      if (stats.coins >= amount) {
        stats.coins -= amount;
        await GameStorage.saveGameStats(stats);
        
        this.emitEvent('coins_gained', { amount: -amount });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error spending coins:', error);
      return false;
    }
  }

  async addCoins(amount: number): Promise<void> {
    try {
      const stats = await GameStorage.getGameStats();
      stats.coins += amount;
      await GameStorage.saveGameStats(stats);
      
      this.emitEvent('coins_gained', { amount });
    } catch (error) {
      console.error('Error adding coins:', error);
    }
  }

  // Get current progress for XP bar
  getCurrentLevelProgress(): { current: number; required: number; percentage: number } {
    return GameStorage.getGameStats().then(stats => {
      const required = LEVEL_XP_REQUIREMENTS[stats.level] - LEVEL_XP_REQUIREMENTS[stats.level - 1];
      const current = stats.currentXP;
      const percentage = (current / required) * 100;
      
      return { current, required, percentage };
    });
  }
}

// Singleton instance
export const gameManager = new GameManager();