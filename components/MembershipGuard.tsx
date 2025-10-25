'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth'
import { customFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, UserCheck, X } from 'lucide-react'

interface MembershipGuardProps {
  children: React.ReactNode
  tenantId: string
  requiredRole?: 'admin' | 'editor' | 'viewer'
}

interface Membership {
  role: 'admin' | 'editor' | 'viewer'
  tenantId: string
  userId: string
}

export function MembershipGuard({ children, tenantId, requiredRole = 'viewer' }: MembershipGuardProps) {
  const { user } = useAuth()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const roleHierarchy = { viewer: 1, editor: 2, admin: 3 }

  useEffect(() => {
    if (user) {
      checkMembership()
    } else {
      setIsLoading(false)
    }
  }, [user, tenantId])

  const checkMembership = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Check if user has membership with this tenant
      const response = await customFetch<{ data: Membership[] }>(`/tenants/${tenantId}/memberships`, {
        method: 'GET',
        auth: true,
        tenantId
      })

      const userMembership = response.data?.find(m => m.userId === user?.id)
      
      if (!userMembership) {
        setError('You do not have access to this tenant. Please contact an administrator.')
        return
      }

      // Check if user has required role level
      if (roleHierarchy[userMembership.role] < roleHierarchy[requiredRole]) {
        setError(`You need ${requiredRole} access or higher to view this page. Your current role: ${userMembership.role}`)
        return
      }

      setMembership(userMembership)
    } catch (error: any) {
      console.error('Error checking membership:', error)
      setError('Failed to verify access permissions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600 font-medium">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <UserCheck className="w-16 h-16 text-orange-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to access the dashboard.</p>
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !membership) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={checkMembership}
                variant="outline"
                className="flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                Retry
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Go Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
