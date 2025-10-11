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

// Initialize Stripe with Connect account context so confirmations target the connected account
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
const connectAccountId = process.env.NEXT_PUBLIC_STRIPE_CONNECT_ACCOUNT_ID
const stripePromise = loadStripe(
  publishableKey,
  connectAccountId ? { stripeAccount: connectAccountId } : undefined
)

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

  useEffect(() => {
    setMounted(true)
    // Initialize Stripe with the tenant-specific account
    loadStripe(
      publishableKey,
      { stripeAccount: stripeAccountId }
    ).then(setStripe)
  }, [stripeAccountId])

  if (!mounted || !stripe) {
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
