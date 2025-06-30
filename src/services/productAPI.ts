import { Product, ProductAPIResponse } from '../types';
import { ImageService } from './imageService';

const API_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

export const ProductAPI = {
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/product/${barcode}.json`);
      const data: ProductAPIResponse = await response.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        
        return {
          barcode: product.code,
          name: product.product_name || 'Produto sem nome',
          brand: product.brands || 'Marca desconhecida',
          quantity: 1,
          unitPrice: 0, // Preço deve ser inserido manualmente
          totalPrice: 0,
          category: product.categories_tags?.[0]?.replace('en:', '') || 'Sem categoria',
          imageUrl: product.image_url
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  },

  // Cache local de produtos escaneados para uso offline
  async cacheProduct(product: Product): Promise<void> {
    try {
      const cacheKey = `@ProductCache:${product.barcode}`;
      await import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => 
        AsyncStorage.setItem(cacheKey, JSON.stringify(product))
      );
    } catch (error) {
      console.error('Error caching product:', error);
    }
  },

  async getCachedProduct(barcode: string): Promise<Product | null> {
    try {
      const cacheKey = `@ProductCache:${barcode}`;
      const data = await import('@react-native-async-storage/async-storage').then(({ default: AsyncStorage }) => 
        AsyncStorage.getItem(cacheKey)
      );
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached product:', error);
      return null;
    }
  },

  // Busca primeiro no cache, depois na API
  async searchProduct(barcode: string): Promise<Product | null> {
    // Primeiro tenta buscar no cache
    const cachedProduct = await this.getCachedProduct(barcode);
    if (cachedProduct) {
      // Verificar se há imagem local para este produto
      const localImage = await ImageService.getProductImage(barcode);
      if (localImage && !cachedProduct.imageUrl) {
        cachedProduct.imageUrl = localImage;
      }
      return cachedProduct;
    }

    // Se não encontrar no cache, busca na API
    const apiProduct = await this.getProductByBarcode(barcode);
    if (apiProduct) {
      // Verificar se há imagem local para este produto
      const localImage = await ImageService.getProductImage(barcode);
      if (localImage) {
        apiProduct.imageUrl = localImage;
      }
      
      // Salva no cache para uso futuro
      await this.cacheProduct(apiProduct);
      return apiProduct;
    }

    return null;
  },

  // Atualizar imagem do produto
  async updateProductImage(barcode: string, imageUri: string): Promise<void> {
    try {
      // Salvar imagem localmente
      await ImageService.saveProductImage(barcode, imageUri);
      
      // Atualizar cache se produto existir
      const cachedProduct = await this.getCachedProduct(barcode);
      if (cachedProduct) {
        const localImage = await ImageService.getProductImage(barcode);
        if (localImage) {
          cachedProduct.imageUrl = localImage;
          await this.cacheProduct(cachedProduct);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar imagem do produto:', error);
      throw error;
    }
  }
};