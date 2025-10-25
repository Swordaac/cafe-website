'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/auth'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export function AuthTest() {
  const { user } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkSession = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Session check result:', { session, error })
      setSessionInfo({ session, error })
    } catch (error) {
      console.error('Error checking session:', error)
      setSessionInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testApiCall = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setSessionInfo({ error: 'No access token available' })
        return
      }

      const response = await fetch('http://localhost:4000/v1/tenants/Bouchees/memberships', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      console.log('API call result:', { status: response.status, data })
      setSessionInfo({ apiResponse: { status: response.status, data } })
    } catch (error) {
      console.error('Error making API call:', error)
      setSessionInfo({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-4">Auth Debug</h3>
      <div className="space-y-2 mb-4">
        <p><strong>User:</strong> {user ? `${user.email} (${user.id})` : 'Not logged in'}</p>
        <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
      </div>
      
      <div className="space-x-2 mb-4">
        <Button onClick={checkSession} disabled={loading}>
          Check Session
        </Button>
        <Button onClick={testApiCall} disabled={loading}>
          Test API Call
        </Button>
      </div>

      {sessionInfo && (
        <div className="mt-4 p-3 bg-white border rounded">
          <h4 className="font-medium mb-2">Debug Info:</h4>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
