import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useGame } from '@/src/contexts/GameContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function LevelUpModal() {
  const { showLevelUpModal, levelUpData, gameStats, dismissLevelUpModal } = useGame();
  
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const titleScale = useSharedValue(0);
  const levelScale = useSharedValue(0);
  const rewardsOpacity = useSharedValue(0);
  const unlocksOpacity = useSharedValue(0);
  const confettiOpacity = useSharedValue(0);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'border');
  const goldColor = '#FFD700';
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  useEffect(() => {
    if (showLevelUpModal && levelUpData) {
      // Sequential animation
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15 });
      
      // Delayed animations
      titleScale.value = withDelay(200, withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      ));
      
      levelScale.value = withDelay(400, withSequence(
        withSpring(1.3, { damping: 6 }),
        withSpring(1, { damping: 10 })
      ));
      
      rewardsOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
      unlocksOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
      
      // Show confetti
      confettiOpacity.value = withDelay(100, withTiming(1, { duration: 100 }));
    }
  }, [showLevelUpModal, levelUpData]);

  const handleDismiss = () => {
    // Exit animation
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 300 });
    confettiOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(dismissLevelUpModal)();
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
      transform: [{ scale: scale.value }],
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: titleScale.value }],
    };
  });

  const levelStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      levelScale.value,
      [0, 1.3, 1],
      [0, 15, 0],
      Extrapolate.CLAMP
    );
    
    return {
      transform: [
        { scale: levelScale.value },
        { rotate: `${rotation}deg` }
      ],
    };
  });

  const rewardsStyle = useAnimatedStyle(() => {
    return {
      opacity: rewardsOpacity.value,
      transform: [{
        translateY: interpolate(
          rewardsOpacity.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        )
      }],
    };
  });

  const unlocksStyle = useAnimatedStyle(() => {
    return {
      opacity: unlocksOpacity.value,
      transform: [{
        translateY: interpolate(
          unlocksOpacity.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        )
      }],
    };
  });

  const confettiStyle = useAnimatedStyle(() => {
    return {
      opacity: confettiOpacity.value,
    };
  });

  if (!showLevelUpModal || !levelUpData || !gameStats) return null;

  return (
    <Modal
      transparent
      visible={showLevelUpModal}
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
            count={100}
            origin={{ x: screenWidth / 2, y: screenHeight / 4 }}
            explosionSpeed={400}
            fallSpeed={2500}
            fadeOut={true}
            colors={['#FFD700', '#FFA500', '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4']}
          />
        </Animated.View>

        <Animated.View style={[styles.container, contentStyle]}>
          <View style={[styles.card, { backgroundColor, borderColor }]}>
            
            {/* Celebration header */}
            <Animated.View style={[styles.header, titleStyle]}>
              <Text style={[styles.celebration, { color: goldColor }]}>🎉</Text>
              <Text style={[styles.title, { color: goldColor }]}>
                LEVEL UP!
              </Text>
              <Text style={[styles.celebration, { color: goldColor }]}>🎉</Text>
            </Animated.View>

            {/* Level display */}
            <Animated.View style={[styles.levelContainer, levelStyle]}>
              <View style={[styles.levelBadge, { backgroundColor: goldColor }]}>
                <IconSymbol name="star.fill" size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.levelText, { color: textColor }]}>
                Nível {gameStats.level}
              </Text>
              <Text style={[styles.levelSubtext, { color: textColor, opacity: 0.6 }]}>
                Parabéns pelo progresso!
              </Text>
            </Animated.View>

            {/* Rewards */}
            <Animated.View style={[styles.rewards, rewardsStyle]}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Recompensas
              </Text>
              
              <View style={styles.rewardsList}>
                <View style={[styles.rewardItem, { backgroundColor: goldColor + '20' }]}>
                  <IconSymbol name="dollarsign.circle.fill" size={20} color="#FFA500" />
                  <Text style={[styles.rewardText, { color: textColor }]}>
                    +{levelUpData.coinsGained} moedas
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Unlocks */}
            {levelUpData.unlocks.length > 0 && (
              <Animated.View style={[styles.unlocks, unlocksStyle]}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  Novos Recursos Desbloqueados
                </Text>
                
                {levelUpData.unlocks.map((unlock, index) => (
                  <View key={index} style={[styles.unlockItem, { borderColor }]}>
                    <IconSymbol name="lock.open.fill" size={16} color={primaryColor} />
                    <Text style={[styles.unlockText, { color: textColor }]}>
                      {unlock}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            )}

            {/* Continue button */}
            <TouchableOpacity 
              style={[styles.continueButton, { backgroundColor: goldColor }]}
              onPress={handleDismiss}
            >
              <Text style={styles.continueButtonText}>Continuar</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    width: screenWidth * 0.9,
    maxWidth: 400,
    zIndex: 2,
  },
  card: {
    borderRadius: 24,
    borderWidth: 2,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  celebration: {
    fontSize: 32,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  levelBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  levelSubtext: {
    fontSize: 16,
    textAlign: 'center',
  },
  rewards: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  rewardsList: {
    alignItems: 'center',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 4,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  unlocks: {
    width: '100%',
    marginBottom: 24,
  },
  unlockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  unlockText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  continueButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
});