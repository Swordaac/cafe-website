'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/ProductCard"
import { Navbar } from "@/components/Navbar"
import { customFetch } from "@/lib/api"
import { Product, Category } from "@/lib/types"
import { Zap, DollarSign, Smartphone, MapPin, Download, ShoppingCart, Star, Mail, Settings } from 'lucide-react'
import { HomeClient } from './HomeClient'
import { useAuth } from '@/contexts/auth'
// import { DebugEnv } from '@/components/DebugEnv'

interface HomeProps {
  searchParams: { search?: string }
}

export default function Home({ searchParams }: HomeProps) {
  const { user } = useAuth()
  const searchTerm = searchParams.search;
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getProducts = async () => {
      try {
        setIsLoading(true)
        const tenantId = 'Bouchees'
        
        // Debug: Log the API URL being used
        console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT_SET')
        console.log('NODE_ENV:', process.env.NODE_ENV)
        
        const [productsRes, categoriesRes] = await Promise.all([
          customFetch<{ data: Product[] }>(`/tenants/${tenantId}/products${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ''}`, { 
            method: 'GET', 
            tenantId
          }),
          customFetch<{ data: Category[] }>(`/tenants/${tenantId}/categories`, { 
            method: 'GET', 
            tenantId
          })
        ])
        
        const productsData = productsRes.data || []
        const categoriesData = categoriesRes.data || []
        
        // Group products by category
        const productsByCategoryData = productsData.reduce((acc, product) => {
          const categoryName = categoriesData.find(cat => cat._id === product.categoryId)?.name || 'Other';
          if (!acc[categoryName]) acc[categoryName] = [];
          acc[categoryName].push(product);
          return acc;
        }, {} as Record<string, Product[]>);
        
        setProducts(productsData)
        setCategories(categoriesData)
        setProductsByCategory(productsByCategoryData)
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([])
        setCategories([])
        setProductsByCategory({})
      } finally {
        setIsLoading(false)
      }
    }

    getProducts()
  }, [searchTerm])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading delicious menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* <DebugEnv /> */}
      {/* Hero Section */}
      <section
        className="relative h-[40vh] md:h-[60vh] lg:h-[60vh] flex items-center justify-center text-center text-white overflow-hidden"
        style={{
          backgroundImage: "url('/heroImage.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="mb-8">
            {/* Logo/Brand Icon */}
            {/* <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border-2 border-white/30 overflow-hidden">
              <img 
                src="/logo.PNG" 
                alt="Bouchees Logo" 
                className="w-20 h-20 object-cover rounded-full"
              />
            </div>
             */}
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
            {/* <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link href="/dashboard" className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  MANAGE MENU
                </Link>
              ) : (
                <Link href="/auth" className="bg-white text-orange-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-orange-50 transition-all duration-300 transform hover:scale-105 shadow-xl">
                  SIGN UP AS CUSTOMER
                </Link>
              )}
            </div> */}
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-20 w-12 h-12 bg-white/10 rounded-full animate-pulse delay-500"></div>
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

          {/* Category Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 max-w-6xl mx-auto px-4">
            {categories.map((category, index) => (
              <Link
                key={category._id}
                href={`/categories/${category._id}`}
                className="group relative bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-white/30 hover:border-white/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Category Image */}
                <div className="relative h-48 sm:h-64 lg:h-80 w-full overflow-hidden">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/20 flex items-center justify-center">
                      <div className="text-white/60 text-4xl sm:text-5xl lg:text-6xl font-bold">
                        {category.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                </div>
                
                {/* Category Name */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 lg:p-6">
                  <h3 className="text-white font-black text-lg sm:text-xl lg:text-2xl xl:text-3xl drop-shadow-lg">
                    {category.name.toUpperCase()}
                  </h3>
                </div>
              </Link>
            ))}
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

      {/* Description Section */}
<section className="py-20 px-6 max-w-4xl mx-auto text-center leading-relaxed">
  <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8">
    Our Story – <span className="text-orange-600">Bouchées</span>
  </h2>

  <p className="text-lg text-gray-700 mb-6">
    Every idea starts with a feeling. For Aziz, the founder of Bouchées, that feeling was joy—the simple kind you experience when you share good food with people you love. It began with a small dream: What if a dessert could bring people together? Not just to eat, but to connect, smile, and make memories.
  </p>

  <p className="text-lg text-gray-700 mb-6">
    Bouchées does things differently. Our mini pancakes are made with butter, giving them a soft and comforting texture, just like a homemade treat. For Aziz, quality matters. He believes that when food is made with care, people can taste and feel it too.
  </p>

  <p className="text-lg text-gray-700 mb-6">
    This is our second location, and it exists because people believed in us. They came back not only for the pancakes, but for the experience. They laughed, shared boxes, took photos, brought friends, and spread the word. Bouchées started to grow, not just in size, but in community.
  </p>

  <p className="text-xl font-semibold text-orange-600 mb-8">
    Spread the Joy.
  </p>

  <p className="text-lg text-gray-800 font-medium">
    📍 Come visit us at <span className="font-bold">1455 Rue Guy</span>
  </p>
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
          {/* <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {user ? (
              <Link href="/dashboard" className="bg-white text-orange-600 px-10 py-4 rounded-full font-bold text-xl hover:bg-orange-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-2">
                <Settings className="w-6 h-6" />
                MANAGE MENU
              </Link>
            ) : (
              <Link href="/auth" className="bg-white text-orange-600 px-10 py-4 rounded-full font-bold text-xl hover:bg-orange-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                SIGN UP AS CUSTOMER
              </Link>
            )}
            <HomeClient />
          </div> */}
          
          {/* <div className="mt-12 flex justify-center space-x-8 text-orange-200">
            <a href="#" className="hover:text-white transition-colors duration-300">Instagram</a>
            <a href="#" className="hover:text-white transition-colors duration-300">TikTok</a>
            <a href="#" className="hover:text-white transition-colors duration-300">Facebook</a>
            <a href="#" className="hover:text-white transition-colors duration-300">Twitter</a>
          </div> */}
        </div>
      </section>
    </div>
  )
}

