import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useGame } from '@/src/contexts/GameContext';

interface XPBarProps {
  showLabel?: boolean;
  height?: number;
  borderRadius?: number;
}

export function XPBar({ showLabel = true, height = 20, borderRadius = 10 }: XPBarProps) {
  const { gameStats, getXPProgress } = useGame();
  const progress = useSharedValue(0);
  const sparkle = useSharedValue(0);

  const backgroundColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'border');
  const progressColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const textColor = useThemeColor({}, 'text');

  const xpProgress = getXPProgress();

  useEffect(() => {
    if (gameStats) {
      progress.value = withTiming(xpProgress.percentage, { duration: 1000 });
      
      // Sparkle effect when XP increases
      sparkle.value = withTiming(1, { duration: 300 }, () => {
        sparkle.value = withTiming(0, { duration: 300 });
      });
    }
  }, [gameStats?.currentXP, gameStats?.totalXP]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
      opacity: interpolate(sparkle.value, [0, 1], [1, 0.7], Extrapolate.CLAMP),
    };
  });

  const sparkleStyle = useAnimatedStyle(() => {
    return {
      opacity: sparkle.value,
      transform: [{ scale: interpolate(sparkle.value, [0, 1], [1, 1.1], Extrapolate.CLAMP) }],
    };
  });

  if (!gameStats) return null;

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.levelText, { color: textColor }]}>
            Nível {gameStats.level}
          </Text>
          <Text style={[styles.xpText, { color: textColor, opacity: 0.6 }]}>
            {xpProgress.current} / {xpProgress.required} XP
          </Text>
        </View>
      )}
      
      <View style={[styles.barContainer, { backgroundColor, height, borderRadius }]}>
        <Animated.View 
          style={[
            styles.progressBar, 
            progressStyle,
            { backgroundColor: progressColor, borderRadius }
          ]} 
        />
        
        {/* Sparkle overlay effect */}
        <Animated.View 
          style={[
            StyleSheet.absoluteFillObject,
            sparkleStyle,
            { backgroundColor: '#FFD700', borderRadius, opacity: 0 }
          ]} 
        />
      </View>
      
      {showLabel && (
        <Text style={[styles.percentageText, { color: textColor, opacity: 0.5 }]}>
          {Math.round(xpProgress.percentage)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  xpText: {
    fontSize: 14,
  },
  barContainer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  percentageText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});