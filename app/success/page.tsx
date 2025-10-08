'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Home, ShoppingBag } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Order Successful!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your order! We've received your payment and will prepare your items shortly.
        </p>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            You will receive a confirmation email shortly with your order details.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Continue Shopping
              </Button>
            </Link>
            
            <Link href="/cart">
              <Button variant="outline" className="w-full sm:w-auto border-orange-600 text-orange-600 hover:bg-orange-50 px-8 py-3 rounded-full flex items-center justify-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                View Cart
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-12 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-medium text-orange-800 mb-2">What's Next?</h3>
          <ul className="text-sm text-orange-700 space-y-1 text-left">
            <li>• Your order is being prepared</li>
            <li>• You'll receive updates via email</li>
            <li>• Estimated pickup time: 15-20 minutes</li>
          </ul>
        </div>
      </div>
    </div>
  )
}