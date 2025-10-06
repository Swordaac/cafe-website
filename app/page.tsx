'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/ProductCard"
import { Navbar } from "@/components/Navbar"
import { customFetch } from "@/lib/api"
import { Product, Category } from "@/lib/types"
import { Zap, DollarSign, Smartphone, MapPin, Download, ShoppingCart, Star, Mail } from 'lucide-react'

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

async function getProducts(searchTerm?: string) {
  try {
    const tenantId = 'Bouchees'
    const [productsRes, categoriesRes] = await Promise.all([
      customFetch<{ data: Product[] }>(`/tenants/${tenantId}/products${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`, { method: 'GET', tenantId }),
      customFetch<{ data: Category[] }>(`/tenants/${tenantId}/categories`, { method: 'GET', tenantId })
    ])
    const products = productsRes.data
    const categories = categoriesRes.data
    
    // Group products by category
    const productsByCategory = products.reduce((acc, product) => {
      const categoryName = categories.find(cat => cat._id === product.categoryId)?.name || 'Other';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
    
    return { products, categories, productsByCategory, searchTerm };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { products: [], categories: [], productsByCategory: {}, searchTerm };
  }
}

interface HomeProps {
  searchParams: { search?: string }
}

export default function Home({ searchParams }: HomeProps) {
  const searchTerm = searchParams.search;
  const [waitlistMessage, setWaitlistMessage] = useState('')
  const [isWaitlistLoading, setIsWaitlistLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProducts(searchTerm)
        setProducts(data.products)
        setCategories(data.categories)
        setProductsByCategory(data.productsByCategory)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [searchTerm])

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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/90 to-orange-500/90"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="mb-8">
            {/* Logo/Brand Icon */}
            <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600">B</span>
              </div>
            </div>
            
            {/* Main Headlines */}
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-2 drop-shadow-lg">
              BOUCHEES
            </h1>
            <h2 className="text-2xl md:text-4xl font-bold tracking-wide mb-6 text-orange-100">
              CAFÉ & BAKERY
            </h2>
            
            {/* Tagline */}
            <p className="text-xl md:text-2xl font-medium mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed">
              Fresh flavors, bold tastes, and unforgettable moments
              <br />
              <span className="text-orange-200">Made for the next generation</span>
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth" className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-all duration-300 transform hover:scale-105 shadow-xl">
                SIGN UP AS CUSTOMER
              </Link>

            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-20 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-500"></div>
      </section>

      {/* Description Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto text-center">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Why Students & Young People
            <span className="block text-orange-600">Love Bouchees</span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Lightning Fast</h3>
            <p className="text-gray-600">Quick service perfect for busy student schedules and study breaks</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Student Budget Friendly</h3>
            <p className="text-gray-600">Delicious food and drinks that won't break your budget</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <div className="w-16 h-16 bg-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Smartphone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Instagram Worthy</h3>
            <p className="text-gray-600">Picture-perfect food that's made for your social media feed</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-3xl p-8 text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">Join the Bouchees Community</h3>
          <p className="text-lg text-orange-100 mb-6 max-w-2xl mx-auto">
            More than just a café - we're your go-to spot for study sessions, 
            hangouts with friends, and those perfect moments you'll remember forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-orange-600 px-6 py-3 rounded-full font-bold hover:bg-orange-50 transition-all duration-300">
              Follow Us @BoucheesCafe
            </button>
            <button className="border-2 border-white text-white px-6 py-3 rounded-full font-bold hover:bg-white hover:text-orange-600 transition-all duration-300">
              Join Our Rewards Program
            </button>
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section className="bg-gradient-to-br from-orange-600 via-orange-700 to-orange-500 py-20 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              OUR MENU
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto">
              Fresh, delicious, and made with love. Every item is crafted to perfection 
              for the modern foodie in you.
            </p>
          </div>

          {/* Category Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category, index) => (
              <button
                key={category._id}
                className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-bold text-lg border-2 border-white/30 hover:bg-white hover:text-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {category.name.toUpperCase()}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/auth" className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              SIGN UP AS CUSTOMER
            </Link>
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
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/5 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-1000"></div>
      </section>

      {/* Products Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
              {searchTerm ? `SEARCH RESULTS FOR "${searchTerm.toUpperCase()}"` : 'FEATURED ITEMS'}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {searchTerm 
                ? `Found ${products.length} ${products.length === 1 ? 'item' : 'items'} matching your search.`
                : "Handpicked favorites that our customers can't get enough of. Fresh ingredients, bold flavors, and Instagram-worthy presentation."
              }
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-600 to-orange-500 mx-auto rounded-full"></div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {searchTerm ? 'No Results Found' : 'Menu Coming Soon!'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `No items found matching "${searchTerm}". Try a different search term.`
                  : "We're working on something amazing for you."
                }
              </p>
              {searchTerm ? (
                <a 
                  href="/"
                  className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-all duration-300"
                >
                  View All Items
                </a>
              ) : (
                <button className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-all duration-300">
                  Get Notified When We Launch
                </button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-4">
              WHAT OUR CUSTOMERS SAY
            </h2>
            <p className="text-xl text-gray-600">Real reviews from real students and young professionals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-xl">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <span className="ml-2 text-gray-600 font-medium">5.0</span>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "OMG, this place is amazing! The food is so fresh and the vibes are perfect for studying. 
                I come here almost every day now!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  S
                </div>
                <div>
                  <p className="font-bold text-gray-800">Sarah M.</p>
                  <p className="text-sm text-gray-600">University Student</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-xl">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <span className="ml-2 text-gray-600 font-medium">5.0</span>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "Best coffee in town! The staff is super friendly and the atmosphere is perfect 
                for hanging out with friends. Highly recommend!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  M
                </div>
                <div>
                  <p className="font-bold text-gray-800">Mike R.</p>
                  <p className="text-sm text-gray-600">College Student</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-xl">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <span className="ml-2 text-gray-600 font-medium">5.0</span>
              </div>
              <p className="text-gray-700 mb-4 italic">
                "The food here is Instagram-worthy and tastes even better than it looks! 
                My friends are always asking where I get my food from."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                  A
                </div>
                <div>
                  <p className="font-bold text-gray-800">Alex K.</p>
                  <p className="text-sm text-gray-600">Young Professional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            READY TO EXPERIENCE BOUCHEES?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students and young professionals who have made Bouchees 
            their go-to spot for great food and great vibes.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/auth" className="bg-white text-orange-600 px-10 py-4 rounded-full font-bold text-xl hover:bg-orange-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              SIGN UP AS CUSTOMER
            </Link>
            <button 
              onClick={() => {
                const email = prompt('Enter your email to join our waitlist:')
                if (email) {
                  joinWaitlist(email)
                }
              }}
              className="border-2 border-white text-white px-10 py-4 rounded-full font-bold text-xl hover:bg-white hover:text-orange-600 transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              <MapPin className="w-6 h-6" />
              JOIN WAITLIST
            </button>
          </div>
          
          {waitlistMessage && (
            <div className="mt-8 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 text-center">
              {waitlistMessage}
            </div>
          )}
          
          <div className="mt-12 flex justify-center space-x-8 text-orange-200">
            <a href="#" className="hover:text-white transition-colors duration-300">Instagram</a>
            <a href="#" className="hover:text-white transition-colors duration-300">TikTok</a>
            <a href="#" className="hover:text-white transition-colors duration-300">Facebook</a>
            <a href="#" className="hover:text-white transition-colors duration-300">Twitter</a>
          </div>
        </div>
      </section>
    </div>
  )
}

