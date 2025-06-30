import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingList } from '../types';
import { formatPrice } from '../utils/priceFormatter';
import { formatDateShort, isToday } from '../utils/dateFormatter';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ShoppingListCardProps {
  shoppingList: ShoppingList;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ShoppingListCard({ shoppingList, onPress, onLongPress }: ShoppingListCardProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'border');
  const accentColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  const budgetPercentage = shoppingList.budget 
    ? (shoppingList.total / shoppingList.budget) * 100 
    : 0;

  const getBudgetColor = () => {
    if (budgetPercentage >= 100) return '#FF3B30';
    if (budgetPercentage >= 80) return '#FF9500';
    return '#34C759';
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor, borderColor }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.supermarket, { color: textColor }]}>
            {shoppingList.supermarket}
          </Text>
          <Text style={[styles.date, { color: textColor, opacity: 0.6 }]}>
            {isToday(shoppingList.date) ? 'Hoje' : formatDateShort(shoppingList.date)}
          </Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={[styles.total, { color: textColor }]}>
            {formatPrice(shoppingList.total)}
          </Text>
          <Text style={[styles.itemCount, { color: textColor, opacity: 0.6 }]}>
            {shoppingList.items.length} {shoppingList.items.length === 1 ? 'item' : 'itens'}
          </Text>
        </View>
      </View>

      {shoppingList.budget && (
        <View style={styles.budgetContainer}>
          <View style={styles.budgetBar}>
            <View 
              style={[
                styles.budgetProgress, 
                { 
                  width: `${Math.min(budgetPercentage, 100)}%`,
                  backgroundColor: getBudgetColor()
                }
              ]} 
            />
          </View>
          <Text style={[styles.budgetText, { color: textColor, opacity: 0.6 }]}>
            {budgetPercentage.toFixed(0)}% do orçamento ({formatPrice(shoppingList.budget)})
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  supermarket: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  total: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemCount: {
    fontSize: 12,
    marginTop: 2,
  },
  budgetContainer: {
    marginTop: 12,
  },
  budgetBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgress: {
    height: '100%',
    borderRadius: 3,
  },
  budgetText: {
    fontSize: 12,
    marginTop: 4,
  },
});