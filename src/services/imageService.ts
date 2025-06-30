import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCT_IMAGES_KEY = '@SuperCompras:productImages';

export const ImageService = {
  // Solicitar permissões
  async requestPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  },

  // Abrir seletor de imagem
  async pickImage(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permissão negada para acessar a galeria');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      throw error;
    }
  },

  // Tirar foto com a câmera
  async takePhoto(): Promise<string | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permissão negada para usar a câmera');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      throw error;
    }
  },

  // Salvar imagem localmente
  async saveProductImage(barcode: string, imageUri: string): Promise<string> {
    try {
      // Criar diretório para imagens de produtos se não existir
      const productImagesDir = `${FileSystem.documentDirectory}product-images/`;
      const dirInfo = await FileSystem.getInfoAsync(productImagesDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(productImagesDir, { intermediates: true });
      }

      // Definir nome do arquivo baseado no código de barras
      const fileName = `${barcode}.jpg`;
      const newPath = `${productImagesDir}${fileName}`;

      // Copiar imagem para o diretório local
      await FileSystem.copyAsync({
        from: imageUri,
        to: newPath,
      });

      // Salvar referência no AsyncStorage
      await this.saveImageReference(barcode, newPath);

      return newPath;
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      throw error;
    }
  },

  // Salvar referência da imagem no AsyncStorage
  async saveImageReference(barcode: string, imagePath: string): Promise<void> {
    try {
      const existingImages = await this.getAllImageReferences();
      existingImages[barcode] = imagePath;
      await AsyncStorage.setItem(PRODUCT_IMAGES_KEY, JSON.stringify(existingImages));
    } catch (error) {
      console.error('Erro ao salvar referência da imagem:', error);
      throw error;
    }
  },

  // Obter todas as referências de imagens
  async getAllImageReferences(): Promise<Record<string, string>> {
    try {
      const data = await AsyncStorage.getItem(PRODUCT_IMAGES_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Erro ao obter referências de imagens:', error);
      return {};
    }
  },

  // Obter imagem do produto
  async getProductImage(barcode: string): Promise<string | null> {
    try {
      const imageReferences = await this.getAllImageReferences();
      const imagePath = imageReferences[barcode];
      
      if (imagePath) {
        // Verificar se o arquivo ainda existe
        const fileInfo = await FileSystem.getInfoAsync(imagePath);
        if (fileInfo.exists) {
          return imagePath;
        } else {
          // Arquivo não existe mais, remover referência
          await this.removeImageReference(barcode);
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter imagem do produto:', error);
      return null;
    }
  },

  // Remover referência de imagem
  async removeImageReference(barcode: string): Promise<void> {
    try {
      const existingImages = await this.getAllImageReferences();
      delete existingImages[barcode];
      await AsyncStorage.setItem(PRODUCT_IMAGES_KEY, JSON.stringify(existingImages));
    } catch (error) {
      console.error('Erro ao remover referência da imagem:', error);
    }
  },

  // Deletar imagem do produto
  async deleteProductImage(barcode: string): Promise<void> {
    try {
      const imagePath = await this.getProductImage(barcode);
      if (imagePath) {
        // Deletar arquivo
        await FileSystem.deleteAsync(imagePath, { idempotent: true });
        // Remover referência
        await this.removeImageReference(barcode);
      }
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
    }
  }
};