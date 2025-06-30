import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ShoppingList, Product } from '../types';
import { StorageService } from '../services/storage';
import uuid from 'react-native-uuid';

interface ShoppingContextData {
  shoppingLists: ShoppingList[];
  currentList: ShoppingList | null;
  loading: boolean;
  
  // List management
  createNewList: (supermarket: string, budget?: number) => Promise<ShoppingList>;
  updateCurrentList: (list: ShoppingList) => Promise<void>;
  finalizeCurrentList: () => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  loadList: (id: string) => Promise<void>;
  
  // Product management
  addProductToCurrentList: (product: Product) => Promise<void>;
  updateProductInCurrentList: (barcode: string, updates: Partial<Product>) => Promise<void>;
  removeProductFromCurrentList: (barcode: string) => Promise<void>;
  
  // Utils
  calculateTotal: (items: Product[]) => number;
  refreshLists: () => Promise<void>;
}

const ShoppingContext = createContext<ShoppingContextData>({} as ShoppingContextData);

interface ShoppingProviderProps {
  children: ReactNode;
}

export function ShoppingProvider({ children }: ShoppingProviderProps) {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [lists, current] = await Promise.all([
        StorageService.getAllShoppingLists(),
        StorageService.getCurrentList()
      ]);
      setShoppingLists(lists);
      setCurrentList(current);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewList = async (supermarket: string, budget?: number): Promise<ShoppingList> => {
    const newList: ShoppingList = {
      id: uuid.v4() as string,
      date: new Date().toISOString(),
      supermarket,
      items: [],
      total: 0,
      budget
    };

    setCurrentList(newList);
    await StorageService.saveCurrentList(newList);
    return newList;
  };

  const updateCurrentList = async (list: ShoppingList) => {
    setCurrentList(list);
    await StorageService.saveCurrentList(list);
  };

  const finalizeCurrentList = async () => {
    if (!currentList) return;

    await StorageService.saveShoppingList(currentList);
    await StorageService.clearCurrentList();
    
    const updatedLists = await StorageService.getAllShoppingLists();
    setShoppingLists(updatedLists);
    setCurrentList(null);
  };

  const deleteList = async (id: string) => {
    await StorageService.deleteShoppingList(id);
    const updatedLists = await StorageService.getAllShoppingLists();
    setShoppingLists(updatedLists);
  };

  const loadList = async (id: string) => {
    const list = shoppingLists.find(l => l.id === id);
    if (list) {
      setCurrentList(list);
      await StorageService.saveCurrentList(list);
    }
  };

  const addProductToCurrentList = async (product: Product) => {
    if (!currentList) return;

    const existingProductIndex = currentList.items.findIndex(
      item => item.barcode === product.barcode
    );

    let updatedItems: Product[];

    if (existingProductIndex >= 0) {
      // Product already exists, update quantity
      updatedItems = [...currentList.items];
      const existingProduct = updatedItems[existingProductIndex];
      existingProduct.quantity += product.quantity;
      existingProduct.totalPrice = existingProduct.unitPrice * existingProduct.quantity;
    } else {
      // New product
      updatedItems = [...currentList.items, product];
    }

    const updatedList = {
      ...currentList,
      items: updatedItems,
      total: calculateTotal(updatedItems)
    };

    await updateCurrentList(updatedList);
  };

  const updateProductInCurrentList = async (barcode: string, updates: Partial<Product>) => {
    if (!currentList) return;

    const updatedItems = currentList.items.map(item => {
      if (item.barcode === barcode) {
        const updated = { ...item, ...updates };
        // Recalculate total price if quantity or unit price changed
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          updated.totalPrice = updated.unitPrice * updated.quantity;
        }
        return updated;
      }
      return item;
    });

    const updatedList = {
      ...currentList,
      items: updatedItems,
      total: calculateTotal(updatedItems)
    };

    await updateCurrentList(updatedList);
  };

  const removeProductFromCurrentList = async (barcode: string) => {
    if (!currentList) return;

    const updatedItems = currentList.items.filter(item => item.barcode !== barcode);
    
    const updatedList = {
      ...currentList,
      items: updatedItems,
      total: calculateTotal(updatedItems)
    };

    await updateCurrentList(updatedList);
  };

  const calculateTotal = (items: Product[]): number => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const refreshLists = async () => {
    await loadInitialData();
  };

  return (
    <ShoppingContext.Provider
      value={{
        shoppingLists,
        currentList,
        loading,
        createNewList,
        updateCurrentList,
        finalizeCurrentList,
        deleteList,
        loadList,
        addProductToCurrentList,
        updateProductInCurrentList,
        removeProductFromCurrentList,
        calculateTotal,
        refreshLists
      }}
    >
      {children}
    </ShoppingContext.Provider>
  );
}

export const useShopping = () => {
  const context = useContext(ShoppingContext);
  if (!context) {
    throw new Error('useShopping must be used within a ShoppingProvider');
  }
  return context;
};