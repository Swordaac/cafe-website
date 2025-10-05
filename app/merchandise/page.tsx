import { CategoryPage } from "@/components/CategoryPage"
import { fetchProductsByCategory } from "@/lib/api"

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

async function getMerchandiseData() {
  try {
    const products = await fetchProductsByCategory('Bouchees', 'merchandise');
    return { products, categoryName: 'Merchandise' };
  } catch (error) {
    console.error('Error fetching merchandise data:', error);
    return { products: [], categoryName: 'Merchandise' };
  }
}

export default async function MerchandisePage() {
  const { products, categoryName } = await getMerchandiseData();

  return (
    <CategoryPage 
      products={products}
      categoryName={categoryName}
      searchPlaceholder="Search merchandise..."
      emptyStateTitle="No Merchandise Available"
      emptyStateDescription="We're working on adding exclusive merchandise to our collection."
    />
  )
}
