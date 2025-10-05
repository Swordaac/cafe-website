'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth'

export default function AuthPage() {
  const { user, loading } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    if (user) {
      getToken()
    }
  }, [user])

  const getToken = async () => {
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token || null
      console.log('Token:', token)
      console.log('Session:', data.session)
      setToken(token)
    } catch (error) {
      console.error('Error getting token:', error)
      setToken(null)
    }
  }

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Signed in successfully!')
        getToken()
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage('Check your email for verification link!')
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setToken(null)
      setMessage('Signed out')
    } catch (error) {
      console.error('Error signing out:', error)
      setMessage('Error signing out')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication</h1>
      
      {!user ? (
        <div className="space-y-4">
          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Sign In
              </button>
              <button type="button" onClick={signUp} className="px-4 py-2 border rounded">
                Sign Up
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-green-600">✅ Signed in as: {user.email}</p>
          
          {token && (
            <div className="space-y-2">
              <p className="text-sm font-medium">JWT Token:</p>
              <textarea
                value={token}
                readOnly
                className="w-full h-32 text-xs border rounded p-2 font-mono"
              />
              <button
                onClick={() => navigator.clipboard.writeText(token)}
                className="px-3 py-1 text-sm bg-gray-100 rounded"
              >
                Copy Token
              </button>
            </div>
          )}
          
          <button onClick={signOut} className="px-4 py-2 bg-red-600 text-white rounded">
            Sign Out
          </button>
        </div>
      )}
      
      {message && (
        <div className={`mt-4 p-3 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  )
}