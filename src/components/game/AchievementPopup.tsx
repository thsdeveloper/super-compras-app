import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useGame } from '@/src/contexts/GameContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function AchievementPopup() {
  const { showAchievementPopup, newAchievement, dismissAchievementPopup } = useGame();
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(-10);
  const confettiOpacity = useSharedValue(0);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'border');
  const successColor = '#34C759';

  useEffect(() => {
    if (showAchievementPopup && newAchievement) {
      // Entry animation
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withSpring(1.1, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      rotate.value = withSpring(0, { damping: 15 });
      
      // Show confetti
      confettiOpacity.value = withTiming(1, { duration: 100 });
      
      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [showAchievementPopup, newAchievement]);

  const handleDismiss = () => {
    // Exit animation
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 });
    confettiOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(dismissAchievementPopup)();
    });
  };

  const modalStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}deg` }
      ],
    };
  });

  const confettiStyle = useAnimatedStyle(() => {
    return {
      opacity: confettiOpacity.value,
    };
  });

  if (!showAchievementPopup || !newAchievement) return null;

  return (
    <Modal
      transparent
      visible={showAchievementPopup}
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[styles.overlay, modalStyle]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          activeOpacity={1} 
          onPress={handleDismiss}
        />
        
        {/* Confetti Effect */}
        <Animated.View style={[styles.confettiContainer, confettiStyle]}>
          <ConfettiCannon
            count={50}
            origin={{ x: screenWidth / 2, y: screenHeight / 3 }}
            explosionSpeed={350}
            fallSpeed={3000}
            fadeOut={true}
            colors={['#FFD700', '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']}
          />
        </Animated.View>

        <Animated.View style={[styles.container, contentStyle]}>
          <View style={[styles.card, { backgroundColor, borderColor }]}>
            
            {/* Header with badge */}
            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: successColor }]}>
                <IconSymbol name="trophy.fill" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: textColor }]}>
                Conquista Desbloqueada!
              </Text>
            </View>

            {/* Achievement info */}
            <View style={styles.achievementInfo}>
              <Text style={styles.emoji}>{newAchievement.emoji}</Text>
              <Text style={[styles.achievementTitle, { color: textColor }]}>
                {newAchievement.title}
              </Text>
              <Text style={[styles.achievementDescription, { color: textColor, opacity: 0.7 }]}>
                {newAchievement.description}
              </Text>
            </View>

            {/* Rewards */}
            <View style={styles.rewards}>
              <View style={styles.rewardItem}>
                <IconSymbol name="star.fill" size={16} color="#FFD700" />
                <Text style={[styles.rewardText, { color: textColor }]}>
                  +{newAchievement.xpReward} XP
                </Text>
              </View>
              
              <View style={styles.rewardItem}>
                <IconSymbol name="dollarsign.circle.fill" size={16} color="#FFA500" />
                <Text style={[styles.rewardText, { color: textColor }]}>
                  +{newAchievement.coinReward} moedas
                </Text>
              </View>
            </View>

            {/* Dismiss button */}
            <TouchableOpacity 
              style={[styles.dismissButton, { backgroundColor: successColor }]}
              onPress={handleDismiss}
            >
              <Text style={styles.dismissButtonText}>Incrível!</Text>
            </TouchableOpacity>

            {/* Close button */}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleDismiss}
            >
              <IconSymbol name="xmark" size={20} color={textColor} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  container: {
    width: screenWidth * 0.85,
    maxWidth: 350,
    zIndex: 2,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  achievementInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  rewards: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dismissButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});