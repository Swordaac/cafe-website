'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatPrice } from '@/lib/api'
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'succeeded' | 'failed'>('pending')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const intentId = searchParams.get('payment_intent')
    if (intentId) {
      setPaymentIntentId(intentId)
    }
  }, [searchParams])

  const handlePayment = async () => {
    if (!paymentIntentId) {
      setError('Payment intent not found')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // In a real implementation, you would integrate with Stripe Elements here
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setPaymentStatus('succeeded')
      
      // Clear cart after successful payment
      setTimeout(() => {
        clearCart()
        router.push('/success')
      }, 2000)
      
    } catch (err) {
      setPaymentStatus('failed')
      setError('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">No Items in Cart</h1>
          <p className="text-gray-600 mb-6">Please add some items to your cart before checking out.</p>
          <Link href="/">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/cart">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Information</h2>
              
              {paymentStatus === 'pending' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-blue-800 font-medium">Payment Method</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      In a real implementation, Stripe Elements would be integrated here for secure payment processing.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVC
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    {isProcessing ? 'Processing Payment...' : `Pay ${formatPrice(cart.totalPrice)}`}
                  </Button>
                </div>
              )}

              {paymentStatus === 'succeeded' && (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600">Your order has been processed successfully.</p>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Failed</h3>
                  <p className="text-gray-600 mb-4">There was an error processing your payment.</p>
                  <Button
                    onClick={() => {
                      setPaymentStatus('pending')
                      setError(null)
                    }}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.product._id} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-orange-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × {formatPrice(item.product.priceCents)}
                      </p>
                    </div>
                    <div className="font-bold text-gray-800">
                      {formatPrice(item.product.priceCents * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-gray-200 my-6" />

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.totalPrice)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between text-xl font-bold text-gray-800">
                  <span>Total</span>
                  <span>{formatPrice(cart.totalPrice)}</span>
                </div>
              </div>
            </Card>

            {/* Security Notice */}
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-800">Secure Checkout</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
