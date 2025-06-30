import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatPrice } from '../utils/priceFormatter';
import { useThemeColor } from '@/hooks/useThemeColor';

interface TotalDisplayProps {
  total: number;
  budget?: number;
  itemCount: number;
}

export function TotalDisplay({ total, budget, itemCount }: TotalDisplayProps) {
  const backgroundColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const textColor = '#FFFFFF';

  const remaining = budget ? budget - total : 0;
  const isOverBudget = budget ? total > budget : false;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: textColor }]}>Total</Text>
        <Text style={[styles.value, { color: textColor }]}>
          {formatPrice(total)}
        </Text>
      </View>

      {budget && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: textColor }]}>
            {isOverBudget ? 'Excedido' : 'Restante'}
          </Text>
          <Text style={[
            styles.value, 
            { 
              color: textColor,
              opacity: isOverBudget ? 0.8 : 1
            }
          ]}>
            {formatPrice(Math.abs(remaining))}
          </Text>
        </View>
      )}

      <View style={[styles.row, styles.itemRow]}>
        <Text style={[styles.itemCount, { color: textColor }]}>
          {itemCount} {itemCount === 1 ? 'item' : 'itens'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    fontSize: 16,
    opacity: 0.9,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  itemRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  itemCount: {
    fontSize: 14,
    opacity: 0.9,
  },
});