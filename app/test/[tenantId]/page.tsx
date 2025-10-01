'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Category = {
  _id: string
  tenantId: string
  name: string
  sortOrder?: number
}

type Product = {
  _id: string
  tenantId: string
  categoryId?: string
  name: string
  description?: string
  priceCents: number
  imageUrl?: string
  availabilityStatus: 'available' | 'unavailable' | 'archived'
}

function useApiBase() {
  return process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/v1'
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export default function TenantCrudTest() {
  const params = useParams() as { tenantId?: string }
  const tenantId = useMemo(() => String(params?.tenantId || ''), [params])
  const apiBase = useApiBase()

  // Categories state
  const [categories, setCategories] = useState<Category[]>([])
  const [catName, setCatName] = useState('')
  const [catSort, setCatSort] = useState<number | ''>('')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [prodName, setProdName] = useState('')
  const [prodDesc, setProdDesc] = useState('')
  const [prodPrice, setProdPrice] = useState<number | ''>('')
  const [prodCategoryId, setProdCategoryId] = useState('')
  const [prodImage, setProdImage] = useState('')
  const [prodStatus, setProdStatus] = useState<'available' | 'unavailable' | 'archived'>('available')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helpers
  const fetchJson = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await fetch(input, init)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message = (body && body.error) || res.statusText
      throw new Error(message)
    }
    return res.status === 204 ? null : res.json()
  }

  // Load categories/products
  const loadData = async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const cats = await fetchJson(`${apiBase}/tenants/${tenantId}/categories`)
      const prods = await fetchJson(`${apiBase}/tenants/${tenantId}/products`)
      setCategories(cats?.data ?? [])
      setProducts(prods?.data ?? [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  // Category handlers
  const createCategory = async () => {
    const token = await getAccessToken()
    if (!token) return setError('Sign in required')
    try {
      setError(null)
      await fetchJson(`${apiBase}/tenants/${tenantId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: catName, sortOrder: catSort === '' ? undefined : Number(catSort) }),
      })
      setCatName('')
      setCatSort('')
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Failed to create category')
    }
  }

  const updateCategory = async (id: string, fields: Partial<Pick<Category, 'name' | 'sortOrder'>>) => {
    const token = await getAccessToken()
    if (!token) return setError('Sign in required')
    try {
      setError(null)
      await fetchJson(`${apiBase}/tenants/${tenantId}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      })
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Failed to update category')
    }
  }

  const deleteCategory = async (id: string) => {
    const token = await getAccessToken()
    if (!token) return setError('Sign in required')
    try {
      setError(null)
      await fetchJson(`${apiBase}/tenants/${tenantId}/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete category')
    }
  }

  // Product handlers
  const createProduct = async () => {
    const token = await getAccessToken()
    if (!token) return setError('Sign in required')
    try {
      setError(null)
      await fetchJson(`${apiBase}/tenants/${tenantId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          categoryId: prodCategoryId || undefined,
          name: prodName,
          description: prodDesc || undefined,
          priceCents: prodPrice === '' ? undefined : Number(prodPrice),
          imageUrl: prodImage || undefined,
          availabilityStatus: prodStatus,
        }),
      })
      setProdName('')
      setProdDesc('')
      setProdPrice('')
      setProdCategoryId('')
      setProdImage('')
      setProdStatus('available')
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Failed to create product')
    }
  }

  const updateProduct = async (id: string, fields: Partial<Omit<Product, '_id' | 'tenantId'>>) => {
    const token = await getAccessToken()
    if (!token) return setError('Sign in required')
    try {
      setError(null)
      await fetchJson(`${apiBase}/tenants/${tenantId}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fields),
      })
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Failed to update product')
    }
  }

  const deleteProduct = async (id: string) => {
    const token = await getAccessToken()
    if (!token) return setError('Sign in required')
    try {
      setError(null)
      await fetchJson(`${apiBase}/tenants/${tenantId}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await loadData()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete product')
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Tenant CRUD Test</h1>
      <p className="text-sm text-gray-600">Tenant ID: <code>{tenantId || '(missing)'}</code></p>
      <p className="text-sm text-gray-600">API Base: <code>{apiBase}</code></p>
      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 p-3">{error}</div>
      )}
      {loading && <div className="text-gray-500">Loading…</div>}

      {/* Categories */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Categories</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Name</label>
            <input className="border rounded px-2 py-1" value={catName} onChange={(e) => setCatName(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Sort Order</label>
            <input className="border rounded px-2 py-1" type="number" value={catSort} onChange={(e) => setCatSort(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <button className="px-3 py-2 rounded bg-teal-600 text-white" onClick={createCategory} disabled={!catName}>Create</button>
          <button className="px-3 py-2 rounded border" onClick={loadData}>Refresh</button>
        </div>

        <ul className="divide-y rounded border">
          {categories.map((c) => (
            <li key={c._id} className="p-3 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-gray-600">sort: {c.sortOrder ?? '-'}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded border" onClick={() => updateCategory(c._id, { name: `${c.name} *` })}>Rename</button>
                <button className="px-2 py-1 rounded border" onClick={() => updateCategory(c._id, { sortOrder: (c.sortOrder ?? 0) + 1 })}>+ Sort</button>
                <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => deleteCategory(c._id)}>Delete</button>
              </div>
            </li>
          ))}
          {categories.length === 0 && <li className="p-3 text-gray-500">No categories</li>}
        </ul>
      </section>

      {/* Products */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium">Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Name</label>
            <input className="border rounded px-2 py-1" value={prodName} onChange={(e) => setProdName(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Description</label>
            <input className="border rounded px-2 py-1" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Price (cents)</label>
            <input className="border rounded px-2 py-1" type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Image URL</label>
            <input className="border rounded px-2 py-1" value={prodImage} onChange={(e) => setProdImage(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Category</label>
            <select className="border rounded px-2 py-1" value={prodCategoryId} onChange={(e) => setProdCategoryId(e.target.value)}>
              <option value="">(none)</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600">Status</label>
            <select className="border rounded px-2 py-1" value={prodStatus} onChange={(e) => setProdStatus(e.target.value as any)}>
              <option value="available">available</option>
              <option value="unavailable">unavailable</option>
              <option value="archived">archived</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-teal-600 text-white" onClick={createProduct} disabled={!prodName || prodPrice === ''}>Create</button>
          <button className="px-3 py-2 rounded border" onClick={loadData}>Refresh</button>
        </div>

        <ul className="divide-y rounded border">
          {products.map((p) => (
            <li key={p._id} className="p-3 flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-600">${'{'}(p.priceCents/100).toFixed(2){'}'} · {p.availabilityStatus}</div>
                <div className="text-xs text-gray-600">category: {p.categoryId || '(none)'}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded border" onClick={() => updateProduct(p._id, { name: `${p.name} *` })}>Rename</button>
                <button className="px-2 py-1 rounded border" onClick={() => updateProduct(p._id, { availabilityStatus: p.availabilityStatus === 'available' ? 'unavailable' : 'available' })}>Toggle</button>
                <button className="px-2 py-1 rounded bg-red-600 text-white" onClick={() => deleteProduct(p._id)}>Delete</button>
              </div>
            </li>
          ))}
          {products.length === 0 && <li className="p-3 text-gray-500">No products</li>}
        </ul>
      </section>
    </div>
  )
}


