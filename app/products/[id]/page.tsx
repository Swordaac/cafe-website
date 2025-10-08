'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { customFetch } from "@/lib/api"
import { Product, Category } from "@/lib/types"
import { formatPrice } from "@/lib/api"
import { useCart } from "@/contexts/cart"
import { ArrowLeft, Plus, Minus, Heart, Share2, Star, Clock, MapPin, Phone, ShoppingCart } from 'lucide-react'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  const { addToCart, cart } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch product details
        const productRes = await customFetch<{ data: Product }>(`/tenants/Bouchees/products/${productId}`, {
          method: 'GET',
          tenantId: 'Bouchees'
        })
        
        const productData = productRes.data
        setProduct(productData)
        
        // Fetch category if product has one
        if (productData.categoryId) {
          const categoryRes = await customFetch<{ data: Category }>(`/tenants/Bouchees/categories/${productData.categoryId}`, {
            method: 'GET',
            tenantId: 'Bouchees'
          })
          setCategory(categoryRes.data)
        }
        
      } catch (err) {
        console.error('Error fetching product:', err)
        setError('Product not found')
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const handleAddToOrder = async () => {
    if (!product) return
    
    setIsAddingToCart(true)
    try {
      addToCart(product, quantity)
      // Show success feedback
      setTimeout(() => setIsAddingToCart(false), 1000)
    } catch (err) {
      console.error('Error adding to cart:', err)
      setIsAddingToCart(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // TODO: Show toast notification
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => router.back()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-orange-600"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="p-2 text-gray-400 hover:text-orange-600"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl shadow-lg overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-orange-200 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <span className="text-gray-500 font-medium">Image Coming Soon</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Image Gallery Placeholder */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Category & Status */}
            <div className="flex items-center space-x-3">
              {category && (
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  {category.name}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                product.availabilityStatus === 'available' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.availabilityStatus === 'available' ? 'AVAILABLE' : 'SOLD OUT'}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl lg:text-4xl font-black text-gray-800 leading-tight">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black text-orange-600">
                {formatPrice(product.priceCents)}
              </span>
              <span className="text-gray-500 text-lg">per item</span>
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-800">Description</h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-800">Quantity</h3>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 font-bold text-lg min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <span className="text-gray-600">
                  Total: <span className="font-bold text-orange-600">
                    {formatPrice(product.priceCents * quantity)}
                  </span>
                </span>
              </div>
            </div>

            {/* Add to Order Button */}
            <Button
              onClick={handleAddToOrder}
              disabled={product.availabilityStatus !== 'available' || isAddingToCart}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {isAddingToCart 
                ? 'Adding to Cart...' 
                : product.availabilityStatus === 'available' 
                  ? `Add ${quantity} to Cart - ${formatPrice(product.priceCents * quantity)}`
                  : 'Currently Unavailable'
              }
            </Button>

            {/* Store Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Store Information</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-orange-600" />
                  <span>123 University Ave, Campus District</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-3 text-orange-600" />
                  <span>(555) 123-BOUCHEES</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3 text-orange-600" />
                  <span>Mon-Fri: 7AM-10PM, Sat-Sun: 8AM-11PM</span>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Customer Reviews</h3>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-gray-600 font-medium">4.8 (127 reviews)</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      S
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Sarah M.</p>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    "Absolutely love this! Perfect for my morning coffee run. The quality is amazing and the taste is incredible."
                  </p>
                </div>
                
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      M
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Mike R.</p>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    "Great value for money! My go-to order every time I visit Bouchees."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
