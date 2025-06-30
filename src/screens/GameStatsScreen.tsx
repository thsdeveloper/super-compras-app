import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useGame } from '@/src/contexts/GameContext';
import { XPBar } from '@/src/components/game/XPBar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { formatPrice } from '@/src/utils/priceFormatter';

export default function GameStatsScreen() {
  const { gameStats, achievements, dailyChallenge, loading } = useGame();
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardColor = useThemeColor({ light: '#F2F2F7', dark: '#1C1C1E' }, 'card');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'border');
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const goldColor = '#FFD700';
  const greenColor = '#34C759';

  if (loading || !gameStats) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <IconSymbol name="clock" size={48} color={textColor} style={{ opacity: 0.3 }} />
          <Text style={[styles.loadingText, { color: textColor }]}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedAchievements = achievements.filter(a => a.completed);
  const totalAchievements = achievements.length;

  const gameStatsCards = [
    {
      title: 'Level',
      value: gameStats.level.toString(),
      icon: 'star.fill',
      color: goldColor,
    },
    {
      title: 'XP Total',
      value: gameStats.totalXP.toLocaleString(),
      icon: 'bolt.fill',
      color: primaryColor,
    },
    {
      title: 'Moedas',
      value: gameStats.coins.toString(),
      icon: 'dollarsign.circle.fill',
      color: '#FFA500',
    },
    {
      title: 'Streak',
      value: `${gameStats.dailyStreak} dias`,
      icon: 'flame.fill',
      color: '#FF6B35',
    },
  ];

  const userStatsCards = [
    {
      title: 'Total de Scans',
      value: gameStats.stats.totalScans.toString(),
      icon: 'barcode.viewfinder',
      color: primaryColor,
    },
    {
      title: 'Economia Total',
      value: formatPrice(gameStats.stats.totalSavings),
      icon: 'banknote',
      color: greenColor,
    },
    {
      title: 'Listas Completas',
      value: gameStats.stats.completedLists.toString(),
      icon: 'checklist',
      color: '#8E44AD',
    },
    {
      title: 'Sucesso no Orçamento',
      value: gameStats.stats.budgetSuccesses.toString(),
      icon: 'target',
      color: '#E74C3C',
    },
  ];

  const renderStatCard = ({ item }: { item: any }) => (
    <View style={[styles.statCard, { backgroundColor: cardColor, borderColor }]}>
      <IconSymbol name={item.icon} size={28} color={item.color} />
      <Text style={[styles.statValue, { color: textColor }]}>{item.value}</Text>
      <Text style={[styles.statTitle, { color: textColor, opacity: 0.7 }]}>{item.title}</Text>
    </View>
  );

  const renderAchievement = ({ item }: { item: any }) => (
    <View style={[
      styles.achievementCard, 
      { 
        backgroundColor: cardColor, 
        borderColor: item.completed ? goldColor : borderColor,
        opacity: item.completed ? 1 : 0.6
      }
    ]}>
      <Text style={styles.achievementEmoji}>{item.emoji}</Text>
      <View style={styles.achievementInfo}>
        <Text style={[styles.achievementTitle, { color: textColor }]}>
          {item.title}
        </Text>
        <Text style={[styles.achievementDescription, { color: textColor, opacity: 0.7 }]}>
          {item.description}
        </Text>
        {item.completed && (
          <View style={styles.achievementRewards}>
            <View style={styles.rewardBadge}>
              <IconSymbol name="star.fill" size={12} color={goldColor} />
              <Text style={[styles.rewardText, { color: textColor }]}>
                +{item.xpReward} XP
              </Text>
            </View>
            <View style={styles.rewardBadge}>
              <IconSymbol name="dollarsign.circle.fill" size={12} color="#FFA500" />
              <Text style={[styles.rewardText, { color: textColor }]}>
                +{item.coinReward}
              </Text>
            </View>
          </View>
        )}
      </View>
      {item.completed && (
        <IconSymbol name="checkmark.circle.fill" size={24} color={greenColor} />
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Gamificação</Text>
          <Text style={[styles.subtitle, { color: textColor, opacity: 0.6 }]}>
            Seu progresso e conquistas
          </Text>
        </View>

        {/* XP Progress */}
        <View style={[styles.xpSection, { backgroundColor: cardColor, borderColor }]}>
          <XPBar showLabel={true} height={24} />
        </View>

        {/* Game Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Estatísticas do Jogo</Text>
          <FlatList
            data={gameStatsCards}
            renderItem={renderStatCard}
            keyExtractor={(item) => item.title}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.statsGrid}
          />
        </View>

        {/* Daily Challenge */}
        {dailyChallenge && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Desafio do Dia</Text>
            <View style={[styles.challengeCard, { backgroundColor: cardColor, borderColor }]}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeEmoji}>{dailyChallenge.emoji}</Text>
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, { color: textColor }]}>
                    {dailyChallenge.title}
                  </Text>
                  <Text style={[styles.challengeDescription, { color: textColor, opacity: 0.7 }]}>
                    {dailyChallenge.description}
                  </Text>
                </View>
                {dailyChallenge.completed && (
                  <IconSymbol name="checkmark.circle.fill" size={24} color={greenColor} />
                )}
              </View>
              
              {/* Progress Bar */}
              <View style={styles.challengeProgress}>
                <View style={[styles.progressBarBg, { backgroundColor: borderColor }]}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        backgroundColor: dailyChallenge.completed ? greenColor : primaryColor,
                        width: `${Math.min((dailyChallenge.currentProgress / dailyChallenge.target) * 100, 100)}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: textColor, opacity: 0.7 }]}>
                  {dailyChallenge.currentProgress} / {dailyChallenge.target}
                </Text>
              </View>
              
              {/* Rewards */}
              <View style={styles.challengeRewards}>
                <View style={styles.rewardBadge}>
                  <IconSymbol name="star.fill" size={12} color={goldColor} />
                  <Text style={[styles.rewardText, { color: textColor }]}>
                    +{dailyChallenge.xpReward} XP
                  </Text>
                </View>
                <View style={styles.rewardBadge}>
                  <IconSymbol name="dollarsign.circle.fill" size={12} color="#FFA500" />
                  <Text style={[styles.rewardText, { color: textColor }]}>
                    +{dailyChallenge.coinReward}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* User Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Estatísticas de Uso</Text>
          <FlatList
            data={userStatsCards}
            renderItem={renderStatCard}
            keyExtractor={(item) => item.title}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.statsGrid}
          />
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.achievementsHeader}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Conquistas</Text>
            <Text style={[styles.achievementCount, { color: textColor, opacity: 0.6 }]}>
              {completedAchievements.length} / {totalAchievements}
            </Text>
          </View>
          
          <FlatList
            data={achievements}
            renderItem={renderAchievement}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  xpSection: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    margin: 4,
    minHeight: 100,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  challengeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
  },
  challengeProgress: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  challengeRewards: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementCount: {
    fontSize: 14,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  achievementRewards: {
    flexDirection: 'row',
    gap: 8,
  },
});