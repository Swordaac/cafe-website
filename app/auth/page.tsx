'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from '@/contexts/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Navbar } from '@/components/Navbar'
import { Mail, Lock, User, Heart, Star, Coffee, ArrowRight, CheckCircle } from 'lucide-react'

export default function AuthPage() {
  const { user, loading } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setShowSuccess(true)
        setMessage('')
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
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

  const joinWaitlist = async () => {
    if (!email) {
      setMessage('Please enter your email to join the waitlist')
      return
    }
    
    setIsLoading(true)
    setMessage('')
    
    try {
      // For now, we'll just show a success message
      // In a real app, you'd send this to your backend
      setMessage('🎉 You\'ve joined our waitlist! We\'ll notify you when we launch.')
      setTimeout(() => setMessage(''), 5000)
    } catch (error) {
      setMessage('Error joining waitlist. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-orange-600 font-medium">Loading...</p>
      </div>
    </div>
  )

  // Success page after registration
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
          <Card className="max-w-md w-full p-8 text-center shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to Bouchees! 🎉
            </h1>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Your account has been created successfully! We've sent a verification link to your email. 
              Please check your inbox and click the link to verify your account.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-orange-800">
                <strong>Next steps:</strong>
              </p>
              <ul className="text-sm text-orange-700 mt-2 space-y-1">
                <li>• Check your email for verification link</li>
                <li>• Click the link to activate your account</li>
                <li>• Start exploring our delicious menu!</li>
              </ul>
            </div>
            
            <Button 
              onClick={() => setShowSuccess(false)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold"
            >
              Back to Login
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Navbar />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6 py-12">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Branding & Benefits */}
          <div className="text-center lg:text-left space-y-8">
            <div>
              <h1 className="text-5xl lg:text-6xl font-black text-gray-800 mb-4">
                Welcome to
                <span className="block text-orange-600">Bouchees</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Join thousands of students and young professionals who have made Bouchees 
                their go-to spot for great food and great vibes.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Premium Coffee</h3>
                  <p className="text-sm text-gray-600">Freshly brewed daily</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Made with Love</h3>
                  <p className="text-sm text-gray-600">Every item crafted with care</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Student Friendly</h3>
                  <p className="text-sm text-gray-600">Budget-friendly prices</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Community</h3>
                  <p className="text-sm text-gray-600">Join our growing family</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Auth Form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md p-8 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600">
                  {isSignUp 
                    ? 'Join the Bouchees community today!' 
                    : 'Sign in to your account to continue'
                  }
                </p>
              </div>
              
              {!user ? (
                <form onSubmit={isSignUp ? signUp : signIn} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold text-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        {isSignUp ? 'Creating Account...' : 'Signing In...'}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </div>
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      {isSignUp 
                        ? 'Already have an account? Sign in' 
                        : "Don't have an account? Sign up"
                      }
                    </button>
                  </div>
                  
                  {/* Waitlist CTA */}
                  <div className="border-t pt-6">
                    <p className="text-center text-gray-600 mb-4">
                      Not ready to create an account?
                    </p>
                    <Button
                      type="button"
                      onClick={joinWaitlist}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 py-3 rounded-xl font-bold"
                    >
                      Join Our Waitlist
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Welcome back, {user.email?.split('@')[0]}! 👋
                    </h3>
                    <p className="text-gray-600">
                      You're successfully signed in to your Bouchees account.
                    </p>
                  </div>
                  
                  {token && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">JWT Token:</p>
                      <textarea
                        value={token}
                        readOnly
                        className="w-full h-24 text-xs border rounded p-2 font-mono bg-white"
                      />
                      <Button
                        onClick={() => navigator.clipboard.writeText(token)}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Copy Token
                      </Button>
                    </div>
                  )}
                  
                  <Button 
                    onClick={signOut} 
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </Button>
                </div>
              )}
              
              {message && (
                <div className={`mt-6 p-4 rounded-xl ${
                  message.includes('Error') 
                    ? 'bg-red-50 border border-red-200 text-red-700' 
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                  <p className="text-center font-medium">{message}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}