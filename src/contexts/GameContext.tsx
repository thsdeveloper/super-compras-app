import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  UserGameStats, 
  Achievement, 
  DailyChallenge, 
  WeeklyChallenge, 
  LevelUpData,
  GameEvent 
} from '../types/gamification';
import { GameStorage } from '../services/gameStorage';
import { gameManager } from '../services/gameManager';

interface GameContextData {
  // State
  gameStats: UserGameStats | null;
  achievements: Achievement[];
  dailyChallenge: DailyChallenge | null;
  weeklyChallenge: WeeklyChallenge | null;
  loading: boolean;

  // Events
  showLevelUpModal: boolean;
  levelUpData: LevelUpData | null;
  showAchievementPopup: boolean;
  newAchievement: Achievement | null;
  showComboEffect: boolean;
  comboData: { count: number; multiplier: number } | null;

  // Actions
  refreshGameData: () => Promise<void>;
  dismissLevelUpModal: () => void;
  dismissAchievementPopup: () => void;
  dismissComboEffect: () => void;
  
  // Game Actions
  onProductScanned: () => Promise<void>;
  onListCompleted: (totalAmount: number, budgetAmount?: number) => Promise<void>;
  onManualPriceEntry: () => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  
  // Utilities
  getXPProgress: () => { current: number; required: number; percentage: number };
}

const GameContext = createContext<GameContextData>({} as GameContextData);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [gameStats, setGameStats] = useState<UserGameStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [weeklyChallenge, setWeeklyChallenge] = useState<WeeklyChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  // Event states
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showComboEffect, setShowComboEffect] = useState(false);
  const [comboData, setComboData] = useState<{ count: number; multiplier: number } | null>(null);

  // Initialize game system
  useEffect(() => {
    initializeGame();
  }, []);

  // Set up game event listeners
  useEffect(() => {
    const handleGameEvent = (event: GameEvent) => {
      switch (event.type) {
        case 'level_up':
          setLevelUpData(event.data);
          setShowLevelUpModal(true);
          break;
          
        case 'achievement_unlocked':
          setNewAchievement(event.data);
          setShowAchievementPopup(true);
          break;
          
        case 'combo_increased':
          setComboData({ 
            count: event.data.count, 
            multiplier: event.data.multiplier 
          });
          setShowComboEffect(true);
          // Auto dismiss combo after 2 seconds
          setTimeout(() => setShowComboEffect(false), 2000);
          break;
          
        case 'xp_gained':
        case 'coins_gained':
          // Refresh stats when XP or coins change
          refreshGameStats();
          break;
      }
    };

    gameManager.addEventListener(handleGameEvent);
    
    return () => {
      gameManager.removeEventListener(handleGameEvent);
    };
  }, []);

  const initializeGame = async () => {
    try {
      setLoading(true);
      
      // Initialize achievements if not already done
      await initializeAchievements();
      
      // Update daily streak
      await gameManager.updateDailyStreak();
      
      // Load all game data
      await refreshGameData();
      
      // Generate daily challenge if needed
      await generateDailyChallengeIfNeeded();
      
    } catch (error) {
      console.error('Error initializing game:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshGameData = async () => {
    try {
      const [stats, achievementsList, daily, weekly] = await Promise.all([
        GameStorage.getGameStats(),
        GameStorage.getAchievements(),
        GameStorage.getDailyChallenge(),
        GameStorage.getWeeklyChallenge(),
      ]);

      setGameStats(stats);
      setAchievements(achievementsList);
      setDailyChallenge(daily);
      setWeeklyChallenge(weekly);
    } catch (error) {
      console.error('Error refreshing game data:', error);
    }
  };

  const refreshGameStats = async () => {
    try {
      const stats = await GameStorage.getGameStats();
      setGameStats(stats);
    } catch (error) {
      console.error('Error refreshing game stats:', error);
    }
  };

  const initializeAchievements = async () => {
    try {
      const existingAchievements = await GameStorage.getAchievements();
      
      if (existingAchievements.length === 0) {
        // Initialize default achievements
        const defaultAchievements: Achievement[] = [
          {
            id: 'first_scan',
            title: 'Primeiro Scan',
            description: 'Escaneie seu primeiro produto',
            emoji: '🎯',
            requirement: 1,
            currentProgress: 0,
            completed: false,
            xpReward: 50,
            coinReward: 10,
            type: 'first_scan',
          },
          {
            id: 'economista',
            title: 'Economista',
            description: 'Economize R$ 50 em uma compra',
            emoji: '💰',
            requirement: 50,
            currentProgress: 0,
            completed: false,
            xpReward: 100,
            coinReward: 25,
            type: 'savings',
          },
          {
            id: 'streak_semanal',
            title: 'Streak Semanal',
            description: 'Use o app 7 dias seguidos',
            emoji: '🔥',
            requirement: 7,
            currentProgress: 0,
            completed: false,
            xpReward: 150,
            coinReward: 30,
            type: 'streak',
          },
          {
            id: 'cacador_ofertas',
            title: 'Caçador de Ofertas',
            description: 'Escaneie 50 produtos',
            emoji: '🏹',
            requirement: 50,
            currentProgress: 0,
            completed: false,
            xpReward: 200,
            coinReward: 40,
            type: 'scans',
          },
          {
            id: 'mestre_orcamento',
            title: 'Mestre do Orçamento',
            description: 'Fique abaixo do orçamento 5 vezes seguidas',
            emoji: '👑',
            requirement: 5,
            currentProgress: 0,
            completed: false,
            xpReward: 300,
            coinReward: 50,
            type: 'budget',
          },
          {
            id: 'nivel_explorador',
            title: 'Explorador',
            description: 'Alcance o nível 5',
            emoji: '🗺️',
            requirement: 5,
            currentProgress: 0,
            completed: false,
            xpReward: 100,
            coinReward: 20,
            type: 'level',
          },
          {
            id: 'veterano',
            title: 'Veterano',
            description: 'Alcance o nível 10',
            emoji: '⭐',
            requirement: 10,
            currentProgress: 0,
            completed: false,
            xpReward: 250,
            coinReward: 50,
            type: 'level',
          },
          {
            id: 'especialista',
            title: 'Especialista',
            description: 'Alcance o nível 20',
            emoji: '🎖️',
            requirement: 20,
            currentProgress: 0,
            completed: false,
            xpReward: 500,
            coinReward: 100,
            type: 'level',
          },
          {
            id: 'scanner_profissional',
            title: 'Scanner Profissional',
            description: 'Escaneie 100 produtos',
            emoji: '📱',
            requirement: 100,
            currentProgress: 0,
            completed: false,
            xpReward: 300,
            coinReward: 60,
            type: 'scans',
          },
          {
            id: 'super_economista',
            title: 'Super Economista',
            description: 'Economize R$ 500 no total',
            emoji: '💎',
            requirement: 500,
            currentProgress: 0,
            completed: false,
            xpReward: 500,
            coinReward: 100,
            type: 'savings',
          },
        ];

        await GameStorage.saveAchievements(defaultAchievements);
      }
    } catch (error) {
      console.error('Error initializing achievements:', error);
    }
  };

  const generateDailyChallengeIfNeeded = async () => {
    try {
      const today = new Date().toDateString();
      const currentChallenge = await GameStorage.getDailyChallenge();
      
      if (!currentChallenge || new Date(currentChallenge.date).toDateString() !== today) {
        // Generate new daily challenge
        const challenges = [
          {
            title: 'Scanner Expert',
            description: 'Escaneie 10 produtos hoje',
            type: 'scan_products' as ChallengeType,
            target: 10,
            xpReward: 50,
            coinReward: 15,
            emoji: '📱',
          },
          {
            title: 'Preços Precisos',
            description: 'Adicione 5 preços manualmente',
            type: 'add_manual_prices' as ChallengeType,
            target: 5,
            xpReward: 40,
            coinReward: 10,
            emoji: '✏️',
          },
          {
            title: 'Lista Completa',
            description: 'Complete 2 listas de compras',
            type: 'complete_lists' as ChallengeType,
            target: 2,
            xpReward: 60,
            coinReward: 20,
            emoji: '✅',
          },
        ];

        const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        
        const newChallenge: DailyChallenge = {
          id: `daily_${Date.now()}`,
          ...randomChallenge,
          currentProgress: 0,
          completed: false,
          date: new Date().toISOString(),
        };

        await GameStorage.saveDailyChallenge(newChallenge);
        setDailyChallenge(newChallenge);
      }
    } catch (error) {
      console.error('Error generating daily challenge:', error);
    }
  };

  // Modal dismiss functions
  const dismissLevelUpModal = () => {
    setShowLevelUpModal(false);
    setLevelUpData(null);
  };

  const dismissAchievementPopup = () => {
    setShowAchievementPopup(false);
    setNewAchievement(null);
  };

  const dismissComboEffect = () => {
    setShowComboEffect(false);
    setComboData(null);
  };

  // Game action wrappers
  const onProductScanned = async () => {
    await gameManager.onProductScanned();
  };

  const onListCompleted = async (totalAmount: number, budgetAmount?: number) => {
    await gameManager.onListCompleted(totalAmount, budgetAmount);
  };

  const onManualPriceEntry = async () => {
    await gameManager.onManualPriceEntry();
  };

  const spendCoins = async (amount: number) => {
    return await gameManager.spendCoins(amount);
  };

  const getXPProgress = () => {
    if (!gameStats) {
      return { current: 0, required: 100, percentage: 0 };
    }

    const required = gameStats.level < 50 ? 
      require('../types/gamification').LEVEL_XP_REQUIREMENTS[gameStats.level] - 
      require('../types/gamification').LEVEL_XP_REQUIREMENTS[gameStats.level - 1] : 1000;
    
    const current = gameStats.currentXP;
    const percentage = Math.min((current / required) * 100, 100);
    
    return { current, required, percentage };
  };

  return (
    <GameContext.Provider
      value={{
        // State
        gameStats,
        achievements,
        dailyChallenge,
        weeklyChallenge,
        loading,

        // Events
        showLevelUpModal,
        levelUpData,
        showAchievementPopup,
        newAchievement,
        showComboEffect,
        comboData,

        // Actions
        refreshGameData,
        dismissLevelUpModal,
        dismissAchievementPopup,
        dismissComboEffect,

        // Game Actions
        onProductScanned,
        onListCompleted,
        onManualPriceEntry,
        spendCoins,

        // Utilities
        getXPProgress,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};