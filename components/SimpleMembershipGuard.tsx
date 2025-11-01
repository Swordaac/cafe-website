'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertCircle, UserCheck, X } from 'lucide-react'

interface SimpleMembershipGuardProps {
  children: React.ReactNode
  tenantId: string
  requiredRole?: 'admin' | 'editor' | 'viewer'
}

interface Membership {
  role: 'admin' | 'editor' | 'viewer'
  tenantId: string
  userId: string
}

export function SimpleMembershipGuard({ children, tenantId, requiredRole = 'viewer' }: SimpleMembershipGuardProps) {
  const { user } = useAuth()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const roleHierarchy: Record<'viewer' | 'editor' | 'admin', number> = { viewer: 1, editor: 2, admin: 3 }

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

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError('No authentication token available')
        return
      }

      console.log('Making direct API call to check membership...')
      
      const response = await fetch(`https://cafe-website-ce43.onrender.com/v1/tenants/${tenantId}/memberships`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('API error response:', errorData)
        setError(`API Error: ${response.status} - ${errorData.error || response.statusText}`)
        return
      }

      const data = await response.json()
      console.log('API success response:', data)

      const userMembership = data.data?.find((m: Membership) => m.userId === user?.id)
      
      if (!userMembership) {
        setError('You do not have access to this tenant. Please contact an administrator.')
        return
      }

      // Check if user has required role level
      if (roleHierarchy[userMembership.role as keyof typeof roleHierarchy] < roleHierarchy[requiredRole as keyof typeof roleHierarchy]) {
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
