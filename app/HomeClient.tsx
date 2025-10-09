'use client'

import React, { useState } from 'react'
import { Product, Category } from "@/lib/types"
import { Download, MapPin } from 'lucide-react'

interface HomeClientProps {
  products: Product[]
  categories: Category[]
  productsByCategory: Record<string, Product[]>
  searchTerm?: string
}

export function HomeClient({ products, categories, productsByCategory, searchTerm }: HomeClientProps) {
  const [waitlistMessage, setWaitlistMessage] = useState('')
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false)

  const joinWaitlist = async (email: string) => {
    if (!email) {
      setWaitlistMessage('Please enter your email to join the waitlist')
      return
    }
    
    setIsWaitlistLoading(true)
    setWaitlistMessage('')
    
    try {
      // For now, we'll just show a success message
      // In a real app, you'd send this to your backend
      setWaitlistMessage('🎉 You\'ve joined our waitlist! We\'ll notify you when we launch.')
      setTimeout(() => setWaitlistMessage(''), 5000)
    } catch (error) {
      setWaitlistMessage('Error joining waitlist. Please try again.')
    } finally {
      setIsWaitlistLoading(false)
    }
  }

  return (
    <>
      {/* Waitlist functionality */}
      {waitlistMessage && (
        <div className="mt-8 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 text-center">
          {waitlistMessage}
        </div>
      )}
      
      {/* Interactive buttons */}
      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <button 
          onClick={() => {
            const email = prompt('Enter your email to join our waitlist:')
            if (email) {
              joinWaitlist(email)
            }
          }}
          className="border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-orange-600 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          JOIN WAITLIST
        </button>
      </div>
    </>
  )
}
