'use client'

import { ProductCard } from "@/components/ProductCard"
import { Product } from "@/lib/types"
import { Search, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import { fetchProducts } from '@/lib/api'

interface CategoryPageProps {
  products: Product[]
  categoryName: string
  searchPlaceholder?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  tenantId?: string
  categoryId?: string
}

export function CategoryPage({ 
  products, 
  categoryName, 
  searchPlaceholder = `Search ${categoryName.toLowerCase()}...`,
  emptyStateTitle = `No ${categoryName} Available`,
  emptyStateDescription = `We're working on adding delicious ${categoryName.toLowerCase()} to our menu.`,
  tenantId = 'Bouchees',
  categoryId
}: CategoryPageProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [isSearching, setIsSearching] = useState(false)

  // Update filtered products when products prop changes
  useEffect(() => {
    setFilteredProducts(products)
  }, [products])

  // Debounced search function that fetches from backend
  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    
    if (!term.trim()) {
      setFilteredProducts(products)
      return
    }

    setIsSearching(true)
    try {
      // Fetch products with search term from backend
      const searchResults = await fetchProducts(tenantId, categoryId, term)
      setFilteredProducts(searchResults)
    } catch (error) {
      console.error('Error searching products:', error)
      // Fallback to client-side filtering if backend search fails
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(term.toLowerCase()) ||
        product.description?.toLowerCase().includes(term.toLowerCase())
      )
      setFilteredProducts(filtered)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        handleSearch(searchTerm)
      }
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-500 py-16 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
              {categoryName.toUpperCase()}
            </h1>
            <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto">
              {categoryName === 'Puffs' && "Fresh, flaky, and perfectly baked puffs that will melt in your mouth. Made fresh daily with premium ingredients."}
              {categoryName === 'Stuffed Puffs' && "Savory and delicious stuffed puffs filled with premium ingredients. Perfect for a satisfying meal or snack."}
              {categoryName === 'Coffees & Teas' && "Premium coffee and tea beverages crafted with care. From classic espresso to creative specialty drinks."}
              {categoryName === 'Ice Cream' && "Creamy, delicious ice cream and frozen treats made with premium ingredients. Perfect for cooling down on a hot day."}
              {categoryName === 'Merchandise' && "Show your love for Bouchees with our exclusive merchandise. From apparel to accessories, we have something for every fan."}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isSearching ? 'text-orange-500 animate-pulse' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {searchTerm ? 'No Results Found' : emptyStateTitle}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `No items found matching "${searchTerm}". Try a different search term.`
                  : emptyStateDescription
                }
              </p>
              {!searchTerm && (
                <button className="bg-orange-600 text-white px-8 py-3 rounded-full font-bold hover:bg-orange-700 transition-all duration-300">
                  Get Notified When Available
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Our {categoryName} Collection
                </h2>
                <p className="text-gray-600">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
