import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useShopping } from '@/src/contexts/ShoppingContext';
import { useThemeColor } from '@/hooks/useThemeColor';
import { formatPrice, parsePrice } from '@/src/utils/priceFormatter';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams();
  const { currentList, updateProductInCurrentList } = useShopping();
  
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [product, setProduct] = useState<any>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#404040' }, 'border');

  useEffect(() => {
    if (currentList && barcode) {
      const foundProduct = currentList.items.find(item => item.barcode === barcode);
      if (foundProduct) {
        setProduct(foundProduct);
        setQuantity(foundProduct.quantity.toString());
        setUnitPrice(foundProduct.unitPrice.toString().replace('.', ','));
      }
    }
  }, [currentList, barcode]);

  const handleSave = async () => {
    if (!product) return;

    const newQuantity = parseInt(quantity) || 1;
    const newUnitPrice = parsePrice(unitPrice);

    await updateProductInCurrentList(product.barcode, {
      quantity: newQuantity,
      unitPrice: newUnitPrice
    });

    router.back();
  };

  const incrementQuantity = () => {
    const current = parseInt(quantity) || 1;
    setQuantity((current + 1).toString());
  };

  const decrementQuantity = () => {
    const current = parseInt(quantity) || 1;
    if (current > 1) {
      setQuantity((current - 1).toString());
    }
  };

  if (!product) {
    return null;
  }

  const total = (parseInt(quantity) || 1) * parsePrice(unitPrice);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {product.imageUrl && (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        )}

        <Text style={[styles.productName, { color: textColor }]}>{product.name}</Text>
        <Text style={[styles.productBrand, { color: textColor, opacity: 0.6 }]}>
          {product.brand}
        </Text>

        <View style={styles.section}>
          <Text style={[styles.label, { color: textColor }]}>Quantidade</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[styles.quantityButton, { borderColor }]}
              onPress={decrementQuantity}
            >
              <Text style={[styles.quantityButtonText, { color: textColor }]}>−</Text>
            </TouchableOpacity>
            
            <TextInput
              style={[styles.quantityInput, { color: textColor, borderColor }]}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              selectTextOnFocus
            />
            
            <TouchableOpacity
              style={[styles.quantityButton, { borderColor }]}
              onPress={incrementQuantity}
            >
              <Text style={[styles.quantityButtonText, { color: textColor }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: textColor }]}>Preço Unitário</Text>
          <TextInput
            style={[styles.priceInput, { color: textColor, borderColor }]}
            value={unitPrice}
            onChangeText={setUnitPrice}
            keyboardType="numeric"
            placeholder="0,00"
            placeholderTextColor={`${textColor}66`}
            selectTextOnFocus
          />
        </View>

        <View style={[styles.totalSection, { borderTopColor: borderColor }]}>
          <Text style={[styles.totalLabel, { color: textColor }]}>Total</Text>
          <Text style={[styles.totalValue, { color: textColor }]}>
            {formatPrice(total)}
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: primaryColor }]}
            onPress={handleSave}
          >
            <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#F0F0F0',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  productBrand: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  quantityInput: {
    width: 80,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  priceInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
  },
  totalSection: {
    borderTopWidth: 1,
    paddingTop: 24,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 32,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});