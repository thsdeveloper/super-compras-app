import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Image, ActionSheetIOS } from 'react-native';
import { CameraView, Camera, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useShopping } from '@/src/contexts/ShoppingContext';
import { useGame } from '@/src/contexts/GameContext';
import { ProductAPI } from '@/src/services/productAPI';
import { ImageService } from '@/src/services/imageService';
import { Product } from '@/src/types';
import { useThemeColor } from '@/hooks/useThemeColor';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Audio } from 'expo-av';
import { formatPrice, parsePrice } from '@/src/utils/priceFormatter';
import { ComboCounter } from '@/src/components/game/ComboCounter';
import { AchievementPopup } from '@/src/components/game/AchievementPopup';
import { LevelUpModal } from '@/src/components/game/LevelUpModal';

export default function ScannerScreen() {
  const router = useRouter();
  const { addProductToCurrentList } = useShopping();
  const { onProductScanned, onManualPriceEntry } = useGame();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productQuantity, setProductQuantity] = useState('1');
  const [customImageUri, setCustomImageUri] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({ light: '#007AFF', dark: '#0A84FF' }, 'tint');

  useEffect(() => {
    requestPermission();
  }, []);

  const playSuccessSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('@/assets/sounds/beep.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      // Ignore if sound fails
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isProcessing) return;
    
    setScanned(true);
    setIsProcessing(true);
    await playSuccessSound();

    try {
      const product = await ProductAPI.searchProduct(data);
      
      // Trigger gamification for successful scan
      await onProductScanned();
      
      if (product) {
        setCurrentProduct(product);
        setProductName(product.name);
        setProductBrand(product.brand);
        setProductPrice('');
        setProductQuantity('1');
        setCustomImageUri(null);
        setModalVisible(true);
      } else {
        // Product not found, allow manual entry
        setCurrentProduct({
          barcode: data,
          name: '',
          brand: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0
        });
        setProductName('');
        setProductBrand('');
        setProductPrice('');
        setProductQuantity('1');
        setCustomImageUri(null);
        setModalVisible(true);
      }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao buscar produto. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddProduct = async () => {
    if (!productName.trim() || !productPrice.trim()) {
      Alert.alert('Erro', 'Por favor, preencha nome e preço do produto');
      return;
    }

    try {
      const quantity = parseInt(productQuantity) || 1;
      const unitPrice = parsePrice(productPrice);
      
      let imageUrl = currentProduct?.imageUrl;
      
      // Se há imagem customizada, salvar localmente
      if (customImageUri && currentProduct?.barcode) {
        await ProductAPI.updateProductImage(currentProduct.barcode, customImageUri);
        imageUrl = await ImageService.getProductImage(currentProduct.barcode);
      }
      
      const product: Product = {
        ...currentProduct!,
        name: productName,
        brand: productBrand || 'Sem marca',
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        imageUrl: imageUrl || undefined
      };

      await addProductToCurrentList(product);
      
      // Trigger gamification for manual price entry
      if (productPrice.trim()) {
        await onManualPriceEntry();
      }
      
      // Reset for next scan
      setModalVisible(false);
      setScanned(false);
      setCurrentProduct(null);
      setCustomImageUri(null);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar o produto');
    }
  };

  const handleCancel = () => {
    setModalVisible(false);
    setScanned(false);
    setCurrentProduct(null);
    setCustomImageUri(null);
  };

  const showImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tirar Foto', 'Escolher da Galeria'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      Alert.alert(
        'Adicionar Imagem',
        'Como você gostaria de adicionar a imagem?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Tirar Foto', onPress: takePhoto },
          { text: 'Galeria', onPress: pickImage },
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      setIsUploadingImage(true);
      const imageUri = await ImageService.takePhoto();
      if (imageUri) {
        setCustomImageUri(imageUri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickImage = async () => {
    try {
      setIsUploadingImage(true);
      const imageUri = await ImageService.pickImage();
      if (imageUri) {
        setCustomImageUri(imageUri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!permission) {
    return <View style={styles.container}><Text>Carregando...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <Text style={[styles.message, { color: textColor }]}>
          Precisamos de permissão para usar a câmera
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39']
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="xmark" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <View style={styles.scanLine} />
          </View>
        </View>

        <Text style={styles.instruction}>
          Alinhe o código de barras com a linha vermelha
        </Text>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              {currentProduct?.name ? 'Produto Encontrado' : 'Adicionar Produto'}
            </Text>
            
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="Nome do produto"
              placeholderTextColor={`${textColor}66`}
              value={productName}
              onChangeText={setProductName}
              autoFocus={!currentProduct?.name}
            />
            
            <TextInput
              style={[styles.input, { color: textColor, borderColor: textColor }]}
              placeholder="Marca"
              placeholderTextColor={`${textColor}66`}
              value={productBrand}
              onChangeText={setProductBrand}
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput, { color: textColor, borderColor: textColor }]}
                placeholder="Preço"
                placeholderTextColor={`${textColor}66`}
                value={productPrice}
                onChangeText={setProductPrice}
                keyboardType="numeric"
              />
              
              <TextInput
                style={[styles.input, styles.halfInput, { color: textColor, borderColor: textColor }]}
                placeholder="Qtd"
                placeholderTextColor={`${textColor}66`}
                value={productQuantity}
                onChangeText={setProductQuantity}
                keyboardType="numeric"
              />
            </View>

            {/* Informações do produto */}
            {currentProduct && (
              <View style={styles.productInfo}>
                <View style={styles.imageContainer}>
                  {(customImageUri || currentProduct.imageUrl) ? (
                    <Image 
                      source={{ uri: customImageUri || currentProduct.imageUrl }} 
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.productImage, styles.noImageContainer]}>
                      <IconSymbol name="photo" size={40} color={textColor} style={{ opacity: 0.3 }} />
                      <Text style={[styles.noImageText, { color: textColor, opacity: 0.5 }]}>
                        Sem imagem
                      </Text>
                    </View>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.addImageButton, { backgroundColor: primaryColor }]}
                    onPress={showImagePicker}
                    disabled={isUploadingImage}
                  >
                    <IconSymbol 
                      name={isUploadingImage ? "clock" : (customImageUri || currentProduct.imageUrl) ? "camera.fill" : "camera"} 
                      size={16} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.addImageButtonText}>
                      {isUploadingImage 
                        ? 'Carregando...' 
                        : (customImageUri || currentProduct.imageUrl) 
                          ? 'Alterar' 
                          : 'Adicionar'
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.barcodeContainer}>
                  <Text style={[styles.barcodeLabel, { color: textColor, opacity: 0.6 }]}>
                    Código de Barras:
                  </Text>
                  <Text style={[styles.barcodeText, { color: textColor }]}>
                    {currentProduct.barcode}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={[styles.modalButtonText, { color: textColor }]}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: primaryColor }]}
                onPress={handleAddProduct}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Gamification Components */}
      <ComboCounter />
      <AchievementPopup />
      <LevelUpModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 50,
    paddingHorizontal: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanFrame: {
    width: 250,
    height: 160,
    position: 'relative',
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: '#FF0000',
    opacity: 0.8,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 4,
  },
  topLeft: {
    top: -4,
    left: -4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -4,
    right: -4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -4,
    left: -4,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -4,
    right: -4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instruction: {
    padding: 10,
    bottom: 120,
    left: 0,
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
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
  productInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  productImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CCCCCC',
  },
  noImageText: {
    fontSize: 12,
    marginTop: 4,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  addImageButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  barcodeContainer: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    width: '100%',
  },
  barcodeLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  barcodeText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});