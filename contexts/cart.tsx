'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Product, CartItem, Cart, PaymentIntent } from '@/lib/types'
import { customFetch } from '@/lib/api'

interface CartContextType {
  cart: Cart
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  createPaymentIntent: () => Promise<PaymentIntent | null>
  isLoading: boolean
  error: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }

function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity } = action.payload
      const existingItem = state.items.find(item => item.product._id === product._id)
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + quantity,
          totalPrice: state.totalPrice + (product.priceCents * quantity)
        }
      } else {
        const newItem: CartItem = { product, quantity }
        return {
          ...state,
          items: [...state.items, newItem],
          totalItems: state.totalItems + quantity,
          totalPrice: state.totalPrice + (product.priceCents * quantity)
        }
      }
    }
    
    case 'REMOVE_FROM_CART': {
      const { productId } = action.payload
      const itemToRemove = state.items.find(item => item.product._id === productId)
      if (!itemToRemove) return state
      
      const updatedItems = state.items.filter(item => item.product._id !== productId)
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems - itemToRemove.quantity,
        totalPrice: state.totalPrice - (itemToRemove.product.priceCents * itemToRemove.quantity)
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload
      const itemToUpdate = state.items.find(item => item.product._id === productId)
      if (!itemToUpdate) return state
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_FROM_CART', payload: { productId } })
      }
      
      const quantityDiff = quantity - itemToUpdate.quantity
      const updatedItems = state.items.map(item =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      )
      
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems + quantityDiff,
        totalPrice: state.totalPrice + (itemToUpdate.product.priceCents * quantityDiff)
      }
    }
    
    case 'CLEAR_CART':
      return {
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    
    default:
      return state
  }
}

const initialState: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('bouchees-cart')
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart)
        // Validate that the saved cart has the correct structure
        if (parsedCart.items && Array.isArray(parsedCart.items)) {
          dispatch({ type: 'CLEAR_CART' })
          parsedCart.items.forEach((item: CartItem) => {
            if (item.product && item.quantity > 0) {
              dispatch({ type: 'ADD_TO_CART', payload: { product: item.product, quantity: item.quantity } })
            }
          })
        }
      }
    } catch (err) {
      console.error('Error loading cart from localStorage:', err)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('bouchees-cart', JSON.stringify(cart))
    } catch (err) {
      console.error('Error saving cart to localStorage:', err)
    }
  }, [cart])

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.availabilityStatus !== 'available') {
      setError('This product is currently unavailable')
      return
    }
    
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } })
    setError(null)
  }

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId } })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 0) return
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const createPaymentIntent = async (): Promise<PaymentIntent | null> => {
    if (cart.items.length === 0) {
      setError('Cart is empty')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await customFetch<{ data: { clientSecret: string; id: string } }>(
        '/payments/intent',
        {
          method: 'POST',
          tenantId: 'Bouchees',
          body: {
            amount: cart.totalPrice,
            currency: 'usd',
            description: `Order for ${cart.totalItems} item(s) from Bouchees`,
            metadata: {
              items: cart.items.map(item => ({
                productId: item.product._id,
                productName: item.product.name,
                quantity: item.quantity,
                priceCents: item.product.priceCents
              }))
            }
          }
        }
      )

      return {
        id: response.data.id,
        clientSecret: response.data.clientSecret,
        amount: cart.totalPrice,
        currency: 'usd',
        status: 'requires_payment_method'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment intent'
      setError(errorMessage)
      console.error('Error creating payment intent:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    createPaymentIntent,
    isLoading,
    error
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
