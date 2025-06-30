import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useGame } from '@/src/contexts/GameContext';

export function ComboCounter() {
  const { showComboEffect, comboData } = useGame();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({ light: '#FF6B35', dark: '#FF8C69' }, 'combo');

  useEffect(() => {
    if (showComboEffect && comboData) {
      // Entry animation
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      translateY.value = withSpring(0, { damping: 15 });

      // Exit animation after 1.8 seconds
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        scale.value = withTiming(0.8, { duration: 300 });
        translateY.value = withTiming(-30, { duration: 300 });
      }, 1800);

      return () => clearTimeout(timer);
    } else {
      // Reset values
      opacity.value = 0;
      scale.value = 0;
      translateY.value = 50;
    }
  }, [showComboEffect, comboData]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      scale.value,
      [0, 1, 1.2],
      [0, 0.3, 0.6],
      Extrapolate.CLAMP
    );
    
    return {
      opacity: glowOpacity,
      transform: [{ scale: scale.value * 1.1 }],
    };
  });

  if (!showComboEffect || !comboData) return null;

  const getComboColor = (multiplier: number) => {
    switch (multiplier) {
      case 2: return '#FF6B35'; // Orange
      case 3: return '#FF4757'; // Red
      case 4: return '#9c88ff'; // Purple
      case 5: return '#ffa502'; // Gold
      default: return '#FF6B35';
    }
  };

  const comboColor = getComboColor(comboData.multiplier);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Glow effect */}
      <Animated.View 
        style={[
          styles.glow,
          glowStyle,
          { backgroundColor: comboColor }
        ]} 
      />
      
      {/* Main combo display */}
      <Animated.View 
        style={[
          styles.comboContainer,
          animatedStyle,
          { backgroundColor: comboColor }
        ]}
      >
        <Text style={styles.comboText}>
          COMBO
        </Text>
        <Text style={styles.multiplierText}>
          x{comboData.multiplier}
        </Text>
        <Text style={styles.countText}>
          {comboData.count} hits!
        </Text>
      </Animated.View>
      
      {/* Particles effect */}
      {Array.from({ length: 5 }, (_, i) => (
        <ComboParticle 
          key={i} 
          delay={i * 100} 
          color={comboColor}
          show={showComboEffect}
        />
      ))}
    </View>
  );
}

interface ComboParticleProps {
  delay: number;
  color: string;
  show: boolean;
}

function ComboParticle({ delay, color, show }: ComboParticleProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (show) {
      const randomX = (Math.random() - 0.5) * 100;
      const randomY = (Math.random() - 0.5) * 60;
      
      setTimeout(() => {
        opacity.value = withTiming(1, { duration: 200 });
        scale.value = withTiming(1, { duration: 300 });
        translateX.value = withTiming(randomX, { duration: 1000 });
        translateY.value = withTiming(randomY, { duration: 1000 });
        
        setTimeout(() => {
          opacity.value = withTiming(0, { duration: 500 });
          scale.value = withTiming(0, { duration: 500 });
        }, 500);
      }, delay);
    }
  }, [show, delay]);

  const particleStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value }
      ],
    };
  });

  return (
    <Animated.View 
      style={[
        styles.particle,
        particleStyle,
        { backgroundColor: color }
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  glow: {
    position: 'absolute',
    width: 120,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  comboContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  comboText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  multiplierText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});