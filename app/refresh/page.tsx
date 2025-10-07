'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RefreshCw, AlertCircle, ArrowRight, Home } from 'lucide-react'

export default function StripeRefreshPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Check URL parameters for Stripe Connect refresh status
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      setMessage(errorDescription || 'There was an error refreshing the onboarding process.')
    } else {
      setMessage('Your Stripe Connect session has expired. Please complete the onboarding process again.')
    }
  }, [searchParams])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setMessage('')
    
    try {
      // Get a new onboarding link from the backend
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

      if (!response.ok) {
        throw new Error('Failed to get new onboarding link');
      }

      const data = await response.json();
      const onboardingUrl = data.data.url;
      
      // Redirect to the new onboarding URL
      window.location.href = onboardingUrl;
    } catch (error) {
      setMessage('Failed to refresh onboarding. Please try again.')
      console.error('Error getting new onboarding link:', error);
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex items-center justify-center min-h-screen px-6">
        <Card className="max-w-lg w-full p-8 text-center shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCw className="w-16 h-16 text-yellow-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Session Expired
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-yellow-800 mb-2">What Happened?</h3>
            <ul className="text-sm text-yellow-700 space-y-1 text-left">
              <li>• Stripe Connect onboarding sessions expire after a certain time</li>
              <li>• This is a security feature to protect your account</li>
              <li>• You'll need to start the onboarding process again</li>
              <li>• Don't worry - your progress is saved in Stripe</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold flex items-center justify-center"
            >
              {isRefreshing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Start Onboarding Again
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 py-3 rounded-xl font-bold flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Homepage
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
