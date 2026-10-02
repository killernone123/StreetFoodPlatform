import { create } from "zustand";

export type CartItem = {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
};

type CartState = {
  items: CartItem[];

  addToCart: (food: CartItem) => void;
  removeFromCart: (foodId: string) => void;
  increaseQuantity: (foodId: string) => void;
  decreaseQuantity: (foodId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],

  addToCart: (food) =>
    set((state) => {
      const existingItem = state.items.find(
        (item) => item.foodId === food.foodId
      );

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.foodId === food.foodId
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                }
              : item
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            ...food,
            quantity: 1,
          },
        ],
      };
    }),

  removeFromCart: (foodId) =>
    set((state) => ({
      items: state.items.filter(
        (item) => item.foodId !== foodId
      ),
    })),

  increaseQuantity: (foodId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.foodId === foodId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      ),
    })),

  decreaseQuantity: (foodId) =>
    set((state) => ({
      items: state.items
        .map((item) =>
          item.foodId === foodId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0),
    })),

  clearCart: () => set({ items: [] }),
}));