'use client'

import React, { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCart } from '@/contexts/cart'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatPrice, customFetch } from '@/lib/api'
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Gift } from 'lucide-react'
import Link from 'next/link'
import StripeElements from '@/components/StripeElements'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { cart, clearCart, createPaymentIntent } = useCart()
  const { user, loading: authLoading } = useAuth()
  const [paymentIntent, setPaymentIntent] = useState<{ id: string; clientSecret: string; stripeAccountId?: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'succeeded' | 'failed'>('pending')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loyaltySelected, setLoyaltySelected] = useState(false)
  const [loyaltyEnrolled, setLoyaltyEnrolled] = useState(false)
  const [loyaltyStatus, setLoyaltyStatus] = useState<any>(null)
  const [isEnrollingLoyalty, setIsEnrollingLoyalty] = useState(false)
  const hasInitializedPayment = useRef(false)
  const lastLoyaltyState = useRef<{ selected: boolean; userId?: string }>({ selected: false })

  // Check if returning from auth page
  useEffect(() => {
    const returnFromAuth = searchParams.get('returnFromAuth')
    const loyaltyFromAuth = searchParams.get('loyalty')
    if (returnFromAuth === 'true' && loyaltyFromAuth === 'true') {
      setLoyaltySelected(true)
      // Remove query params
      router.replace('/checkout', { scroll: false })
    }
  }, [searchParams, router])

  // Fetch loyalty status if user is signed in
  useEffect(() => {
    const fetchLoyaltyStatus = async () => {
      if (!user || authLoading) return

      try {
        const response = await customFetch<{ data: any }>('/loyalty/status', {
          method: 'GET',
          tenantId: 'Bouchees',
          auth: true,
        })
        setLoyaltyStatus(response.data)
        setLoyaltyEnrolled(response.data.enrolled)
        if (response.data.enrolled) {
          setLoyaltySelected(true)
        }
      } catch (err) {
        // User might not be enrolled yet, that's okay
        console.log('Loyalty status not available:', err)
      }
    }

    fetchLoyaltyStatus()
  }, [user, authLoading])

  // Handle loyalty selection
  const handleLoyaltyToggle = async () => {
    if (!loyaltySelected) {
      // User wants to join loyalty program
      if (!user) {
        // Redirect to auth with return URL
        router.push('/auth?returnFromAuth=true&loyalty=true')
        return
      }

      // User is signed in, enroll them
      setIsEnrollingLoyalty(true)
      try {
        const response = await customFetch<{ data: any }>('/loyalty/enroll', {
          method: 'POST',
          tenantId: 'Bouchees',
          auth: true,
        })
        setLoyaltyEnrolled(true)
        setLoyaltyStatus(response.data)
        setLoyaltySelected(true)
      } catch (err) {
        setError('Failed to enroll in loyalty program. Please try again.')
        console.error('Loyalty enrollment error:', err)
      } finally {
        setIsEnrollingLoyalty(false)
      }
    } else {
      // User wants to unselect loyalty
      setLoyaltySelected(false)
    }
  }

  useEffect(() => {
    const initializePayment = async () => {
      // Don't initialize payment if loyalty is selected but user is not signed in
      if (loyaltySelected && !user && !authLoading) {
        return
      }

      // Check if we need to re-initialize (only if loyalty state or user changed)
      const currentLoyaltyState = {
        selected: loyaltySelected,
        userId: user?.id
      }
      const needsReinit = 
        !hasInitializedPayment.current ||
        lastLoyaltyState.current.selected !== currentLoyaltyState.selected ||
        lastLoyaltyState.current.userId !== currentLoyaltyState.userId

      if (!needsReinit && paymentIntent) {
        return // Already initialized with current state
      }

      // Prevent multiple simultaneous calls
      if (hasInitializedPayment.current) {
        return
      }

      try {
        hasInitializedPayment.current = true
        setIsLoading(true)
        setPaymentIntent(null) // Clear old intent before creating new one
        
        const intent = await createPaymentIntent(loyaltySelected && user ? user.id : undefined)
        if (intent) {
          setPaymentIntent({
            id: intent.id,
            clientSecret: intent.clientSecret,
            stripeAccountId: intent.stripeAccountId
          })
          lastLoyaltyState.current = currentLoyaltyState
        } else {
          hasInitializedPayment.current = false // Reset on failure
          setError('Failed to create payment intent')
        }
      } catch (err) {
        hasInitializedPayment.current = false // Reset on error
        setError('Failed to initialize payment')
        console.error('Payment initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Only initialize when auth is ready
    if (!authLoading) {
      initializePayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loyaltySelected, user?.id, authLoading]) // Only re-init when loyalty or user changes

  const handlePaymentSuccess = () => {
    setPaymentStatus('succeeded')
    
    // Clear cart after successful payment
    setTimeout(() => {
      clearCart()
      router.push('/success')
    }, 2000)
  }

  const handlePaymentError = (errorMessage: string) => {
    setPaymentStatus('failed')
    setError(errorMessage)
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
            {/* Loyalty Program Option */}
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Gift className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Join Our Loyalty Program</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={loyaltySelected}
                        onChange={handleLoyaltyToggle}
                        disabled={isEnrollingLoyalty}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Get a free product every 7 purchases! Track your progress and earn rewards.
                  </p>
                  {loyaltyStatus && loyaltyStatus.enrolled && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">Purchases:</span>
                        <span className="font-bold text-orange-600">{loyaltyStatus.purchaseCount}</span>
                      </div>
                      {loyaltyStatus.freeProductEligible ? (
                        <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-green-800 text-sm font-medium">
                          🎉 You're eligible for a free product!
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">{loyaltyStatus.purchasesUntilFree}</span> more purchase{loyaltyStatus.purchasesUntilFree !== 1 ? 's' : ''} until your next free product
                        </div>
                      )}
                    </div>
                  )}
                  {isEnrollingLoyalty && (
                    <div className="mt-2 text-sm text-orange-700">Enrolling...</div>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Payment Information</h2>
              
              {paymentStatus === 'pending' && (
                <div className="space-y-4">
                  {loyaltySelected && !user && !authLoading ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Sign In Required</h3>
                      <p className="text-gray-600 mb-4">Please sign in to join the loyalty program and continue checkout.</p>
                      <Button
                        onClick={() => router.push('/auth?returnFromAuth=true&loyalty=true')}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Sign In
                      </Button>
                    </div>
                  ) : isLoading ? (
                    <div className="space-y-4">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : paymentIntent ? (
                    <StripeElements
                      clientSecret={paymentIntent.clientSecret}
                      amount={cart.totalPrice}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                      stripeAccountId={paymentIntent.stripeAccountId}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Initialization Failed</h3>
                      <p className="text-gray-600 mb-4">Unable to initialize payment. Please try again.</p>
                      <Button
                        onClick={() => window.location.reload()}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Retry
                      </Button>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
                      {error}
                    </div>
                  )}
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
