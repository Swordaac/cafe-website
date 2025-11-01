'use client'

import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

// Validate publishable key before using it
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!publishableKey || typeof publishableKey !== 'string' || publishableKey.trim().length === 0) {
  console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing or invalid')
}

const connectAccountId = process.env.NEXT_PUBLIC_STRIPE_CONNECT_ACCOUNT_ID

interface StripePaymentFormProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}

function StripePaymentForm({ 
  clientSecret, 
  amount, 
  onSuccess, 
  onError, 
  isProcessing, 
  setIsProcessing 
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      })

      if (error) {
        console.error('Stripe confirmCardPayment error:', error)
        onError(`Payment failed: ${error.message || 'Unknown error'}`)
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess()
      } else {
        onError(`Payment status: ${paymentIntent?.status || 'unknown'}`)
      }
    } catch (err: any) {
      console.error('Stripe confirmation exception:', err)
      onError(`Error: ${err?.message || 'An unexpected error occurred'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: true,
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Information
          </label>
          <div className="p-3 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
            <CardElement options={cardElementOptions} />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        <CreditCard className="w-5 h-5" />
        {isProcessing ? 'Processing Payment...' : `Pay $${(amount / 100).toFixed(2)}`}
      </Button>
    </form>
  )
}

interface StripeElementsProps {
  clientSecret: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
  stripeAccountId: string
}

export default function StripeElements({ 
  clientSecret, 
  amount, 
  onSuccess, 
  onError, 
  isProcessing, 
  setIsProcessing,
  stripeAccountId
}: StripeElementsProps) {
  const [mounted, setMounted] = useState(false)
  const [stripe, setStripe] = useState<any>(null)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    
    // Validate publishableKey before calling loadStripe
    if (!publishableKey) {
      setInitError('Stripe publishable key is not configured')
      return
    }
    
    // Initialize Stripe with the tenant-specific account
    if (stripeAccountId && typeof stripeAccountId === 'string' && stripeAccountId.trim()) {
      loadStripe(
        publishableKey,
        { stripeAccount: stripeAccountId }
      ).then(setStripe).catch(error => {
        console.error('Error loading Stripe with account:', error)
        // Fallback to default initialization
        loadStripe(publishableKey).then(setStripe).catch(fallbackError => {
          console.error('Error loading Stripe (fallback):', fallbackError)
          setInitError('Failed to initialize Stripe. Please check your configuration.')
        })
      })
    } else {
      // Fallback to default Stripe initialization if no account ID
      loadStripe(publishableKey).then(setStripe).catch(error => {
        console.error('Error loading Stripe:', error)
        setInitError('Failed to initialize Stripe. Please check your configuration.')
      })
    }
  }, [stripeAccountId])

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Setup Error</h3>
        <p className="text-gray-600 mb-4">{initError}</p>
        <p className="text-sm text-gray-500">Please contact support if this issue persists.</p>
      </div>
    )
  }

  if (!stripe) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <Elements stripe={stripe}>
      <StripePaymentForm
        clientSecret={clientSecret}
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
      />
    </Elements>
  )
}
