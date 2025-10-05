'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useAuth } from '@/contexts/auth'
import { createClient } from '@/lib/supabase'
import { Search, Menu, X, Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'

function SearchComponent() {
  const [searchValue, setSearchValue] = useState('')
  
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    </div>
  )
}

export function Navbar() {
  const { user, loading } = useAuth()
  const supabase = createClient()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const getLinkClasses = (path: string) => {
    const baseClasses = "px-3 py-2 text-sm font-medium transition-colors"
    const activeClasses = "text-orange-600 border-b-2 border-orange-600"
    const inactiveClasses = "text-gray-700 hover:text-orange-600"
    
    return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`
  }


  return (
    <>
      {/* Top Bar with Social Media and Language */}
      <div className="bg-orange-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span>Language: English</span>
            <span>|</span>
            <span>Français</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Mr. Bouchees Canada</span>
            <div className="flex items-center space-x-3">
              <a href="#" className="hover:text-orange-200 transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-orange-200 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-orange-200 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-orange-200 transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-orange-200 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">BOUCHEES</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="/" className={getLinkClasses('/')}>
                  Menu
                </Link>
                <Link href="/puffs" className={getLinkClasses('/puffs')}>
                  Puffs
                </Link>
                <Link href="/stuffed-puffs" className={getLinkClasses('/stuffed-puffs')}>
                  Stuffed Puffs
                </Link>
                <Link href="/coffees" className={getLinkClasses('/coffees')}>
                  Coffees & Teas
                </Link>
                <Link href="/ice-cream" className={getLinkClasses('/ice-cream')}>
                  Ice Cream
                </Link>
                <Link href="/merchandise" className={getLinkClasses('/merchandise')}>
                  Merchandise
                </Link>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <Suspense fallback={<div className="w-64 h-10 bg-gray-200 rounded-full animate-pulse"></div>}>
                <SearchComponent />
              </Suspense>

              {/* User Actions */}
              <div className="flex items-center space-x-2">
                {loading ? (
                  <div className="h-9" />
                ) : user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">{user.email}</span>
                    <Button variant="outline" onClick={handleSignOut} className="border-orange-600 text-orange-600 hover:bg-orange-50">
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link href="/auth">
                      <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/auth?mode=signup">
                      <Button className="bg-orange-600 hover:bg-orange-700">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-orange-600 p-2"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                href="/" 
                className={`block px-3 py-2 transition-colors ${isActive('/') ? 'text-orange-600 bg-orange-50 font-semibold' : 'text-gray-700 hover:text-orange-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Menu
              </Link>
              <Link 
                href="/puffs" 
                className={`block px-3 py-2 transition-colors ${isActive('/puffs') ? 'text-orange-600 bg-orange-50 font-semibold' : 'text-gray-700 hover:text-orange-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Puffs
              </Link>
              <Link 
                href="/stuffed-puffs" 
                className={`block px-3 py-2 transition-colors ${isActive('/stuffed-puffs') ? 'text-orange-600 bg-orange-50 font-semibold' : 'text-gray-700 hover:text-orange-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Stuffed Puffs
              </Link>
              <Link 
                href="/coffees" 
                className={`block px-3 py-2 transition-colors ${isActive('/coffees') ? 'text-orange-600 bg-orange-50 font-semibold' : 'text-gray-700 hover:text-orange-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Coffees & Teas
              </Link>
              <Link 
                href="/ice-cream" 
                className={`block px-3 py-2 transition-colors ${isActive('/ice-cream') ? 'text-orange-600 bg-orange-50 font-semibold' : 'text-gray-700 hover:text-orange-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Ice Cream
              </Link>
              <Link 
                href="/merchandise" 
                className={`block px-3 py-2 transition-colors ${isActive('/merchandise') ? 'text-orange-600 bg-orange-50 font-semibold' : 'text-gray-700 hover:text-orange-600'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Merchandise
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
