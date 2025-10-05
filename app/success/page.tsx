'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Gift, ArrowRight, Home, User } from 'lucide-react'

export default function SuccessPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to home after 10 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <div className="flex items-center justify-center min-h-screen px-6">
        <Card className="max-w-lg w-full p-8 text-center shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to Bouchees! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your account has been created successfully! We've sent a verification link to your email. 
            Please check your inbox and click the link to verify your account.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-orange-600 mr-2" />
              <h3 className="text-lg font-bold text-orange-800">Special Offer!</h3>
            </div>
            <p className="text-orange-800 font-medium mb-3">
              Show this success page to the café owner for a special discount on your first visit!
            </p>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-orange-700 font-medium">
                "I just signed up for Bouchees and I'm ready for my first visit!"
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Next steps:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Check your email for verification link</li>
              <li>• Click the link to activate your account</li>
              <li>• Visit our café and show this page for your discount!</li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={() => router.push('/')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Homepage
            </Button>
            
            <Button 
              onClick={() => router.push('/auth')}
              variant="outline"
              className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 py-3 rounded-xl font-bold flex items-center justify-center"
            >
              <User className="w-5 h-5 mr-2" />
              Back to Login
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            You'll be automatically redirected to the homepage in a few seconds...
          </p>
        </Card>
      </div>
    </div>
  )
}
