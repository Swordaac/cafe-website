import { CategoryPage } from "@/components/CategoryPage"
import { fetchProducts, fetchCategories, customFetch } from "@/lib/api"
import { Category, Product } from "@/lib/types"
import { notFound } from 'next/navigation'

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

async function getCategoryData(categoryId: string) {
  try {
    const tenantId = 'Bouchees'
    
    // Always fetch categories first to resolve the effective category ID
    const categoriesRes = await customFetch<{ data: Category[] }>(
      `/tenants/${tenantId}/categories`,
      { method: 'GET', tenantId, cache: 'no-store' }
    )
    const categories = categoriesRes.data || []

    const raw = decodeURIComponent(categoryId || '').trim()
    const isLikelyObjectId = /^[a-f\d]{24}$/i.test(raw)

    // Try to resolve by exact ID first (when a valid ObjectId string is used)
    let resolved = isLikelyObjectId
      ? categories.find(cat => cat._id === raw)
      : undefined

    // If not found by ID, try to resolve by name (support slug-like paths)
    if (!resolved) {
      const lower = raw.toLowerCase()
      // Prefer exact name match, then includes
      resolved = categories.find(cat => cat.name.toLowerCase() === lower)
        || categories.find(cat => cat.name.toLowerCase().includes(lower))
    }

    if (!resolved) {
      return null
    }

    // Fetch products using the resolved category ID
    const productsRes = await customFetch<{ data: Product[] }>(
      `/tenants/${tenantId}/products?categoryId=${resolved._id}`,
      { method: 'GET', tenantId, cache: 'no-store' }
    )

    const products = productsRes.data || []

    return {
      products,
      categoryName: resolved.name,
      categoryId: resolved._id
    }
  } catch (error) {
    console.error('Error fetching category data:', error)
    return null
  }
}

export default async function CategoryPageRoute({
  params,
}: {
  params: { categoryId: string }
}) {
  const categoryData = await getCategoryData(params.categoryId)

  if (!categoryData) {
    notFound()
  }

  const { products, categoryName, categoryId } = categoryData

  return (
    <CategoryPage 
      products={products}
      categoryName={categoryName}
      categoryId={categoryId}
      searchPlaceholder={`Search ${categoryName.toLowerCase()}...`}
      emptyStateTitle={`No ${categoryName} Available`}
      emptyStateDescription={`We're working on adding delicious ${categoryName.toLowerCase()} to our menu.`}
    />
  )
}

// Optional: Generate static params for common categories (if you want SSG)
// export async function generateStaticParams() {
//   const tenantId = 'Bouchees'
//   try {
//     const categoriesRes = await customFetch<{ data: Category[] }>(
//       `/tenants/${tenantId}/categories`,
//       { method: 'GET', tenantId }
//     )
//     return (categoriesRes.data || []).map((category) => ({
//       categoryId: category._id,
//     }))
//   } catch {
//     return []
//   }
// }
