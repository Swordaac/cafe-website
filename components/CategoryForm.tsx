'use client'

import React, { useState, useEffect } from 'react'
import { Category } from '@/lib/types'
import { customFetch } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { X, Image as ImageIcon } from 'lucide-react'

interface CategoryFormProps {
  category?: Category | null
  onClose: () => void
  onSuccess: () => void
  tenantId: string
  accessToken?: string
}

export function CategoryForm({ category, onClose, onSuccess, tenantId, accessToken }: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    sortOrder: 0
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        sortOrder: category.sortOrder || 0
      })
      if (category.imageUrl) {
        setImagePreview(category.imageUrl)
      }
    }
  }, [category])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sortOrder' ? parseInt(value) || 0 : value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('sortOrder', formData.sortOrder.toString())
      
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      const url = category 
        ? `/tenants/${tenantId}/categories/${category._id}`
        : `/tenants/${tenantId}/categories`

      const method = category ? 'PUT' : 'POST'

      await customFetch(url, {
        method,
        auth: true,
        tenantId,
        accessTokenOverride: accessToken,
        body: formDataToSend
      })

      onSuccess()
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!category) return
    
    if (!confirm('Are you sure you want to delete this category? This will also remove it from all products.')) return

    setIsLoading(true)
    try {
      await customFetch(`/tenants/${tenantId}/categories/${category._id}`, {
        method: 'DELETE',
        auth: true,
        tenantId,
        accessTokenOverride: accessToken
      })
      onSuccess()
    } catch (error: any) {
      setError(error.message || 'Failed to delete category')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {category ? 'Edit Category' : 'Create Category'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload image</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Category Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter category name"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-2">
                Sort Order
              </label>
              <input
                type="number"
                id="sortOrder"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lower numbers appear first in the menu
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div>
                {category && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    Delete Category
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isLoading ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
