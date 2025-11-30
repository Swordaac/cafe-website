'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth'
import { useRouter } from 'next/navigation'
import { customFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  User, 
  Gift, 
  ShoppingBag, 
  CheckCircle, 
  ArrowLeft,
  Coffee,
  Star
} from 'lucide-react'
import Link from 'next/link'

interface LoyaltyStatus {
  enrolled: boolean
  purchaseCount: number
  stampsInCurrentCycle: number
  freeProductEligible: boolean
  purchasesUntilFree: number
  points: number
  lastPurchaseDate?: string
}

const PURCHASES_FOR_FREE_PRODUCT = 7

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [loyaltyStatus, setLoyaltyStatus] = useState<LoyaltyStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLoyaltyStatus = async () => {
      if (!user || authLoading) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const response = await customFetch<{ data: LoyaltyStatus }>('/loyalty/status', {
          method: 'GET',
          tenantId: 'Bouchees',
          auth: true,
        })
        setLoyaltyStatus(response.data)
      } catch (err) {
        console.error('Error fetching loyalty status:', err)
        setError('Failed to load loyalty status')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLoyaltyStatus()
  }, [user, authLoading])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <User className="w-12 h-12 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Sign In Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your profile and loyalty status.</p>
          <Link href="/auth">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const stampsInCurrentCycle = loyaltyStatus?.stampsInCurrentCycle ?? 0
  const purchasesUntilFree = loyaltyStatus?.purchasesUntilFree ?? PURCHASES_FOR_FREE_PRODUCT
  const isEligible = loyaltyStatus?.freeProductEligible ?? false

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        </div>

        <div className="grid gap-6">
          {/* User Info Card */}
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{user.email}</h2>
                <p className="text-sm text-gray-600">Member since {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>

          {/* Loyalty Program Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Gift className="w-6 h-6 text-orange-600" />
                <h2 className="text-xl font-bold text-gray-800">Loyalty Program</h2>
              </div>
              {loyaltyStatus?.enrolled ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Enrolled
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  Not Enrolled
                </span>
              )}
            </div>

            {loyaltyStatus?.enrolled ? (
              <div className="space-y-6">
                {/* Stamp Progress */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">Current Cycle Progress</h3>
                    <span className="text-sm text-gray-600">
                      {stampsInCurrentCycle} / {PURCHASES_FOR_FREE_PRODUCT} stamps
                    </span>
                  </div>
                  
                  {/* Stamp Cards */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {Array.from({ length: PURCHASES_FOR_FREE_PRODUCT }).map((_, index) => {
                      const isFilled = index < stampsInCurrentCycle
                      const isNext = index === stampsInCurrentCycle && !isEligible
                      
                      return (
                        <div
                          key={index}
                          className={`
                            aspect-square rounded-lg border-2 flex items-center justify-center
                            transition-all duration-300
                            ${isFilled 
                              ? 'bg-orange-600 border-orange-600 text-white shadow-lg scale-105' 
                              : isNext
                              ? 'bg-orange-50 border-orange-300 border-dashed animate-pulse'
                              : 'bg-gray-100 border-gray-300'
                            }
                          `}
                        >
                          {isFilled ? (
                            <Coffee className="w-6 h-6" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-current opacity-50" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stampsInCurrentCycle / PURCHASES_FOR_FREE_PRODUCT) * 100, 100)}%` }}
                    />
                  </div>

                  {/* Status Message */}
                  {isEligible ? (
                    <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 font-semibold">
                          🎉 Congratulations! You're eligible for a free product!
                        </p>
                      </div>
                      <p className="text-sm text-green-700 mt-2">
                        Visit checkout to redeem your free product on your next order.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-orange-800 font-medium">
                        {purchasesUntilFree} more purchase{purchasesUntilFree !== 1 ? 's' : ''} until your next free product
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <ShoppingBag className="w-5 h-5 text-gray-600" />
                      <span className="text-2xl font-bold text-gray-800">
                        {loyaltyStatus.purchaseCount}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Total Purchases</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Star className="w-5 h-5 text-orange-600" />
                      <span className="text-2xl font-bold text-orange-600">
                        {loyaltyStatus.points}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Points</p>
                  </div>
                </div>

                {loyaltyStatus.lastPurchaseDate && (
                  <p className="text-sm text-gray-500 text-center">
                    Last purchase: {new Date(loyaltyStatus.lastPurchaseDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Join our loyalty program and earn a free product every 7 purchases!
                </p>
                <Link href="/checkout">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    Enroll at Checkout
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-red-800">{error}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

