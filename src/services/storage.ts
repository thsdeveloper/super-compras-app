import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingList } from '../types';

const SHOPPING_LISTS_KEY = '@SuperCompras:shoppingLists';
const CURRENT_LIST_KEY = '@SuperCompras:currentList';

export const StorageService = {
  // Shopping Lists
  async getAllShoppingLists(): Promise<ShoppingList[]> {
    try {
      const data = await AsyncStorage.getItem(SHOPPING_LISTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting shopping lists:', error);
      return [];
    }
  },

  async saveShoppingList(list: ShoppingList): Promise<void> {
    try {
      const lists = await this.getAllShoppingLists();
      const index = lists.findIndex(l => l.id === list.id);
      
      if (index >= 0) {
        lists[index] = list;
      } else {
        lists.push(list);
      }
      
      await AsyncStorage.setItem(SHOPPING_LISTS_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error('Error saving shopping list:', error);
      throw error;
    }
  },

  async deleteShoppingList(id: string): Promise<void> {
    try {
      const lists = await this.getAllShoppingLists();
      const filtered = lists.filter(list => list.id !== id);
      await AsyncStorage.setItem(SHOPPING_LISTS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      throw error;
    }
  },

  // Current List (temporary storage while shopping)
  async getCurrentList(): Promise<ShoppingList | null> {
    try {
      const data = await AsyncStorage.getItem(CURRENT_LIST_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting current list:', error);
      return null;
    }
  },

  async saveCurrentList(list: ShoppingList): Promise<void> {
    try {
      await AsyncStorage.setItem(CURRENT_LIST_KEY, JSON.stringify(list));
    } catch (error) {
      console.error('Error saving current list:', error);
      throw error;
    }
  },

  async clearCurrentList(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CURRENT_LIST_KEY);
    } catch (error) {
      console.error('Error clearing current list:', error);
      throw error;
    }
  },

  // Clear all data (for development/testing)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SHOPPING_LISTS_KEY, CURRENT_LIST_KEY]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
};