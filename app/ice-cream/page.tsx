import { CategoryPage } from "@/components/CategoryPage"
import { fetchProductsByCategory } from "@/lib/api"

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

async function getIceCreamData() {
  try {
    const products = await fetchProductsByCategory('Bouchees', 'ice cream');
    return { products, categoryName: 'Ice Cream' };
  } catch (error) {
    console.error('Error fetching ice cream data:', error);
    return { products: [], categoryName: 'Ice Cream' };
  }
}

export default async function IceCreamPage() {
  const { products, categoryName } = await getIceCreamData();

  return (
    <CategoryPage 
      products={products}
      categoryName={categoryName}
      searchPlaceholder="Search ice cream..."
      emptyStateTitle="No Ice Cream Available"
      emptyStateDescription="We're working on adding delicious ice cream options to our menu."
    />
  )
}
