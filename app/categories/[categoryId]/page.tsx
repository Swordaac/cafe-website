import { CategoryPage } from "@/components/CategoryPage"
import { fetchProducts, fetchCategories, customFetch } from "@/lib/api"
import { Category, Product } from "@/lib/types"
import { notFound } from 'next/navigation'

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

async function getCategoryData(categoryId: string) {
  try {
    const tenantId = 'Bouchees'
    
    const [productsRes, categoriesRes] = await Promise.all([
      customFetch<{ data: Product[] }>(
        `/tenants/${tenantId}/products?categoryId=${categoryId}`,
        { method: 'GET', tenantId }
      ),
      customFetch<{ data: Category[] }>(
        `/tenants/${tenantId}/categories`,
        { method: 'GET', tenantId }
      )
    ])
    
    const products = productsRes.data || []
    const categories = categoriesRes.data || []
    const category = categories.find(cat => cat._id === categoryId)
    
    if (!category) {
      return null
    }
    
    return { 
      products, 
      categoryName: category.name,
      categoryId: category._id
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
