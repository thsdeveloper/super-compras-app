import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useShopping } from '../contexts/ShoppingContext';
import { useGame } from '../contexts/GameContext';
import { ShoppingListCard } from '../components/ShoppingListCard';
import { XPBar } from '../components/game/XPBar';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { formatPrice } from '../utils/priceFormatter';

export default function HomeScreen() {
  const router = useRouter();
  const { shoppingLists, currentList, createNewList, deleteList, loadList, loading } = useShopping();
  const { gameStats } = useGame();
  const [modalVisible, setModalVisible] = useState(false);
  const [supermarketName, setSupermarketName] = useState('');
  const [budget, setBudget] = useState('');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  const handleNewList = async () => {
    if (!supermarketName.trim()) {
      Alert.alert('Erro', 'Por favor, insira o nome do supermercado');
      return;
    }

    try {
      const budgetValue = budget ? parseFloat(budget.replace(',', '.')) : undefined;
      console.log('Criando nova lista:', { supermarketName, budgetValue });
      
      await createNewList(supermarketName, budgetValue);
      console.log('Lista criada com sucesso');
      
      setModalVisible(false);
      setSupermarketName('');
      setBudget('');
      
      console.log('Navegando para shopping-list');
      router.replace('/shopping-list');
    } catch (error) {
      console.error('Erro ao criar lista:', error);
      Alert.alert('Erro', 'Não foi possível criar a lista. Tente novamente.');
    }
  };

  const handleOpenList = (id: string) => {
    console.log('Abrindo lista existente:', id);
    loadList(id);
    router.push('/shopping-list');
  };

  const handleDeleteList = (id: string) => {
    Alert.alert(
      'Excluir Lista',
      'Tem certeza que deseja excluir esta lista de compras?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteList(id) }
      ]
    );
  };

  const handleContinueShopping = () => {
    if (currentList) {
      console.log('Continuando compra atual');
      router.push('/shopping-list');
    }
  };

  const totalSpent = shoppingLists.reduce((sum, list) => sum + list.total, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Minhas Compras</Text>
        <Text style={[styles.subtitle, { color: textColor, opacity: 0.6 }]}>
          Total gasto: {formatPrice(totalSpent)}
        </Text>
      </View>

      {/* XP Progress Bar */}
      {gameStats && (
        <View style={styles.xpContainer}>
          <XPBar showLabel={true} height={24} />
        </View>
      )}

      {currentList && (
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: primaryColor }]}
          onPress={handleContinueShopping}
        >
          <IconSymbol name="cart" size={20} color="#FFFFFF" />
          <Text style={styles.continueButtonText}>Continuar Compra Atual</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={shoppingLists}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ShoppingListCard
            shoppingList={item}
            onPress={() => handleOpenList(item.id)}
            onLongPress={() => handleDeleteList(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="cart" size={64} color={textColor} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyText, { color: textColor, opacity: 0.6 }]}>
              Nenhuma compra registrada
            </Text>
            <Text style={[styles.emptySubtext, { color: textColor, opacity: 0.4 }]}>
              Toque no botão + para começar
            </Text>
          </View>
        }
        refreshing={loading}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={() => setModalVisible(true)}
      >
        <IconSymbol name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Nova Lista de Compras</Text>
            
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="Nome do supermercado"
              placeholderTextColor={`${textColor}66`}
              value={supermarketName}
              onChangeText={setSupermarketName}
              autoFocus
            />
            
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="Orçamento (opcional)"
              placeholderTextColor={`${textColor}66`}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: textColor }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleNewList}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  xpContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 8,
  },
  confirmButton: {
    marginLeft: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});