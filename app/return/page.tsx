'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, AlertCircle, ArrowRight, Home } from 'lucide-react'

export default function StripeReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check URL parameters for Stripe Connect return status
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      setStatus('error')
      setMessage(errorDescription || 'There was an error completing the onboarding process.')
    } else {
      setStatus('success')
      setMessage('Stripe Connect onboarding completed successfully! You can now accept payments.')
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex items-center justify-center min-h-screen px-6">
        <Card className="max-w-lg w-full p-8 text-center shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          {status === 'loading' && (
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {status === 'success' && 'Onboarding Complete! 🎉'}
            {status === 'error' && 'Onboarding Failed'}
            {status === 'loading' && 'Processing...'}
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>
          
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-green-800 mb-2">What's Next?</h3>
              <ul className="text-sm text-green-700 space-y-1 text-left">
                <li>✅ Your Stripe account is now connected</li>
                <li>✅ You can accept payments from customers</li>
                <li>✅ Platform fees (10%) will be automatically deducted</li>
                <li>✅ You'll receive payouts to your bank account</li>
              </ul>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-red-800 mb-2">Troubleshooting</h3>
              <ul className="text-sm text-red-700 space-y-1 text-left">
                <li>• Make sure you completed all required fields</li>
                <li>• Check that your bank account details are correct</li>
                <li>• Try the onboarding process again</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </div>
          )}
          
          <div className="space-y-4">
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Homepage
            </Button>
            
            {status === 'error' && (
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:4000/v1/tenants/test-tenant/stripe/account-link', {
                      method: 'POST',
                      headers: {
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwidGVuYW50X2lkIjoidGVzdC10ZW5hbnQiLCJpYXQiOjE3NTk4NjYyODAsImV4cCI6MTc1OTk1MjY4MH0.QRjqcCmrbidaTDIxnZdVq6FfXHjLr-dpSWNDsueRZ_o',
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        returnUrl: 'http://localhost:3001/return',
                        refreshUrl: 'http://localhost:3001/refresh'
                      })
                    });
                    const data = await response.json();
                    window.location.href = data.data.url;
                  } catch (error) {
                    console.error('Error getting onboarding link:', error);
                    setMessage('Failed to get onboarding link. Please try again.');
                  }
                }}
                variant="outline"
                className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 py-3 rounded-xl font-bold flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5 mr-2" />
                Start Onboarding Again
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
