import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useShopping } from '@/src/contexts/ShoppingContext';
import { useGame } from '@/src/contexts/GameContext';
import { ProductItem } from '@/src/components/ProductItem';
import { TotalDisplay } from '@/src/components/TotalDisplay';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AchievementPopup } from '@/src/components/game/AchievementPopup';
import { LevelUpModal } from '@/src/components/game/LevelUpModal';

export default function ShoppingListScreen() {
  const router = useRouter();
  const { 
    currentList, 
    removeProductFromCurrentList,
    finalizeCurrentList,
    loading 
  } = useShopping();
  const { onListCompleted } = useGame();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const successColor = '#34C759';

  useEffect(() => {
    if (!currentList) {
      router.replace('/');
    }
  }, [currentList]);

  const handleProductPress = (barcode: string) => {
    router.push({
      pathname: '/product-details',
      params: { barcode }
    });
  };

  const handleRemoveProduct = (barcode: string) => {
    Alert.alert(
      'Remover Produto',
      'Tem certeza que deseja remover este produto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Remover', 
          style: 'destructive',
          onPress: () => removeProductFromCurrentList(barcode)
        }
      ]
    );
  };

  const handleFinalizePurchase = () => {
    Alert.alert(
      'Finalizar Compra',
      'Deseja finalizar esta compra?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Finalizar', 
          style: 'default',
          onPress: async () => {
            if (currentList) {
              // Trigger gamification for list completion
              await onListCompleted(currentList.total, currentList.budget);
            }
            await finalizeCurrentList();
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleAddProduct = () => {
    router.push('/scanner');
  };

  if (loading || !currentList) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: textColor }]}>
            {currentList.supermarket}
          </Text>
          <Text style={[styles.subtitle, { color: textColor, opacity: 0.6 }]}>
            {currentList.items.length} {currentList.items.length === 1 ? 'item' : 'itens'}
          </Text>
        </View>
        
        {currentList.items.length > 0 && (
          <TouchableOpacity
            style={[styles.finalizeButton, { backgroundColor: successColor }]}
            onPress={handleFinalizePurchase}
          >
            <IconSymbol name="checkmark.circle" size={20} color="#FFFFFF" />
            <Text style={styles.finalizeButtonText}>Finalizar</Text>
          </TouchableOpacity>
        )}
      </View>

      {currentList.items.length > 0 && (
        <TotalDisplay
          total={currentList.total}
          budget={currentList.budget}
          itemCount={currentList.items.length}
        />
      )}

      <FlatList
        data={currentList.items}
        keyExtractor={item => item.barcode}
        renderItem={({ item }) => (
          <ProductItem
            product={item}
            onPress={() => handleProductPress(item.barcode)}
            onRemove={() => handleRemoveProduct(item.barcode)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="cart" size={64} color={textColor} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyText, { color: textColor, opacity: 0.6 }]}>
              Lista vazia
            </Text>
            <Text style={[styles.emptySubtext, { color: textColor, opacity: 0.4 }]}>
              Escaneie produtos para adicionar
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={handleAddProduct}
      >
        <IconSymbol name="barcode.viewfinder" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Gamification Components */}
      <AchievementPopup />
      <LevelUpModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  finalizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  finalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90, // Aumentado para ficar acima da tab bar
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});