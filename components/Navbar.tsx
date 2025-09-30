'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/contexts/auth'
import { createClient } from '@/lib/supabase'

export function Navbar() {
  const { user, loading } = useAuth()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm fixed w-full top-0 z-50">
      <div className="flex items-center space-x-8">
        <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          SPLIT
        </Link>
        <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <Link href="/gallery" className="hover:text-gray-900">
            Gallery
          </Link>
          <Link href="/catering" className="hover:text-gray-900">
            Catering
          </Link>
          <Link href="/events" className="hover:text-gray-900">
            Private Events
          </Link>
          <Link href="/contact" className="hover:text-gray-900">
            Contact Us
          </Link>
          <Link href="/help" className="hover:text-gray-900">
            Help
          </Link>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        {loading ? (
          <div className="h-9" /> // Placeholder during loading
        ) : user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth?mode=signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
