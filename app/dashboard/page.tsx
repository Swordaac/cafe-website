'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth'
import { useRouter } from 'next/navigation'
import { customFetch } from '@/lib/api'
import { signOutUser } from '@/lib/auth-utils'
import { Product, Category } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Package, 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  Upload,
  Settings,
  Users,
  BarChart3,
  LogOut
} from 'lucide-react'
import { ProductForm } from '@/components/ProductForm'
import { CategoryForm } from '@/components/CategoryForm'
import { MembershipGuard } from '@/components/MembershipGuard'
import { SimpleMembershipGuard } from '@/components/SimpleMembershipGuard'
import { AuthTest } from '@/components/AuthTest'

interface DashboardStats {
  totalProducts: number
  totalCategories: number
  availableProducts: number
  unavailableProducts: number
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'analytics'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    availableProducts: 0,
    unavailableProducts: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [tenantToken, setTenantToken] = useState<string | null>(null)

  const tenantId = 'Bouchees' // This should come from user context or URL params

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
      return
    }
    
    if (user) {
      ensureTenantToken().then(() => loadDashboardData())
    }
  }, [user, loading, router])

  const ensureTenantToken = async () => {
    try {
      if (tenantToken) return
      const res = await customFetch<{ data: { token: string } }>(`/tenants/${tenantId}/token`, {
        method: 'POST',
        auth: true,
        tenantId
      })
      setTenantToken(res.data.token)
    } catch (err) {
      console.error('Failed to mint tenant token', err)
    }
  }

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      const [productsRes, categoriesRes] = await Promise.all([
        customFetch<{ data: Product[] }>(`/tenants/${tenantId}/products`, { 
          method: 'GET', 
          auth: true,
          tenantId,
          accessTokenOverride: tenantToken || undefined
        }),
        customFetch<{ data: Category[] }>(`/tenants/${tenantId}/categories`, { 
          method: 'GET', 
          auth: true,
          tenantId,
          accessTokenOverride: tenantToken || undefined
        })
      ])

      const productsData = productsRes.data || []
      const categoriesData = categoriesRes.data || []

      setProducts(productsData)
      setCategories(categoriesData)

      // Calculate stats
      const availableProducts = productsData.filter(p => p.availabilityStatus === 'available').length
      setStats({
        totalProducts: productsData.length,
        totalCategories: categoriesData.length,
        availableProducts,
        unavailableProducts: productsData.length - availableProducts
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOutUser()
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SimpleMembershipGuard tenantId={tenantId} requiredRole="viewer">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-orange-600">Bouchees Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Section */}
        <div className="mb-8">
          <AuthTest />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats.availableProducts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unavailable</p>
                <p className="text-2xl font-bold text-gray-900">{stats.unavailableProducts}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'products'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Products
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'categories'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              Categories
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'products' && (
          <ProductsTab 
            products={filteredProducts}
            categories={categories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onRefresh={loadDashboardData}
            tenantToken={tenantToken}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab 
            categories={categories}
            onRefresh={loadDashboardData}
            tenantId={tenantId}
            tenantToken={tenantToken}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab stats={stats} />
        )}
      </div>
      </div>
    </SimpleMembershipGuard>
  )
}

// Products Tab Component
function ProductsTab({ 
  products, 
  categories, 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory,
  onRefresh,
  tenantToken,
}: {
  products: Product[]
  categories: Category[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  onRefresh: () => void
  tenantToken: string | null
}) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => {
                const category = categories.find(c => c._id === product.categoryId)
                return (
                  <tr key={product._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {product.imageUrl ? (
                            <img
                              className="h-10 w-10 rounded-lg object-cover"
                              src={product.imageUrl}
                              alt={product.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {category?.name || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(product.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.availabilityStatus === 'available'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.availabilityStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Product Modal */}
      {showCreateForm && (
        <ProductForm
          categories={categories}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            onRefresh()
          }}
          tenantId={'Bouchees'}
          accessToken={tenantToken || undefined}
        />
      )}

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setEditingProduct(null)
            onRefresh()
          }}
          tenantId={'Bouchees'}
          accessToken={tenantToken || undefined}
        />
      )}
    </div>
  )
}

// Categories Tab Component
function CategoriesTab({ categories, onRefresh, tenantId, tenantToken }: { categories: Category[], onRefresh: () => void, tenantId: string, tenantToken: string | null }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Categories</h3>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category._id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                <p className="text-sm text-gray-500">Sort Order: {category.sortOrder || 0}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCategory(category)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit Category Modal */}
      {showCreateForm && (
        <CategoryForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false)
            onRefresh()
          }}
          tenantId={tenantId}
          accessToken={tenantToken || undefined}
        />
      )}

      {editingCategory && (
        <CategoryForm
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            setEditingCategory(null)
            onRefresh()
          }}
          tenantId={tenantId}
          accessToken={tenantToken || undefined}
        />
      )}
    </div>
  )
}

// Analytics Tab Component
function AnalyticsTab({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Analytics Overview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Product Distribution</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Available Products</span>
              <span className="text-sm font-medium text-gray-900">{stats.availableProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unavailable Products</span>
              <span className="text-sm font-medium text-gray-900">{stats.unavailableProducts}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${stats.totalProducts > 0 ? (stats.availableProducts / stats.totalProducts) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Products</span>
              <span className="text-sm font-medium text-gray-900">{stats.totalProducts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Categories</span>
              <span className="text-sm font-medium text-gray-900">{stats.totalCategories}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Availability Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.totalProducts > 0 ? Math.round((stats.availableProducts / stats.totalProducts) * 100) : 0}%
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

