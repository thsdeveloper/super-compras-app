import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Product } from '../types';
import { formatPrice } from '../utils/priceFormatter';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface ProductItemProps {
  product: Product;
  onPress?: () => void;
  onRemove?: () => void;
  showImage?: boolean;
}

export function ProductItem({ product, onPress, onRemove, showImage = true }: ProductItemProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'border');
  const dangerColor = '#FF3B30';

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor, borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {showImage && product.imageUrl && (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        )}
        
        <View style={styles.info}>
          <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={[styles.brand, { color: textColor, opacity: 0.6 }]}>
            {product.brand}
          </Text>
          
          <View style={styles.priceRow}>
            <Text style={[styles.quantity, { color: textColor, opacity: 0.8 }]}>
              {product.quantity}x {formatPrice(product.unitPrice)}
            </Text>
            <Text style={[styles.total, { color: textColor }]}>
              {formatPrice(product.totalPrice)}
            </Text>
          </View>
        </View>

        {onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="trash" size={20} color={dangerColor} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 14,
  },
  total: {
    fontSize: 16,
    fontWeight: '600',
  },
  removeButton: {
    marginLeft: 12,
    padding: 8,
  },
});