import { CategoryPage } from "@/components/CategoryPage"
import { fetchProductsByCategory } from "@/lib/api"

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

async function getStuffedPuffsData() {
  try {
    const products = await fetchProductsByCategory('Bouchees', 'stuffed puffs');
    return { products, categoryName: 'Stuffed Puffs' };
  } catch (error) {
    console.error('Error fetching stuffed puffs data:', error);
    return { products: [], categoryName: 'Stuffed Puffs' };
  }
}

export default async function StuffedPuffsPage() {
  const { products, categoryName } = await getStuffedPuffsData();

  return (
    <CategoryPage 
      products={products}
      categoryName={categoryName}
      searchPlaceholder="Search stuffed puffs..."
      emptyStateTitle="No Stuffed Puffs Available"
      emptyStateDescription="We're working on adding delicious stuffed puffs to our menu."
    />
  )
}
