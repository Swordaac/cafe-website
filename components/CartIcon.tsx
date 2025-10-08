'use client'

import { useCart } from '@/contexts/cart'
import { ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export function CartIcon() {
  const { cart } = useCart()

  return (
    <Link href="/cart" className="relative">
      <ShoppingCart className="w-6 h-6 text-gray-600 hover:text-orange-600 transition-colors" />
      {cart.totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {cart.totalItems}
        </span>
      )}
    </Link>
  )
}
