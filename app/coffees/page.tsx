import { CategoryPage } from "@/components/CategoryPage"
import { fetchProductsByCategory } from "@/lib/api"

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

async function getCoffeesData() {
  try {
    const products = await fetchProductsByCategory('Bouchees', 'coffees');
    return { products, categoryName: 'Coffees & Teas' };
  } catch (error) {
    console.error('Error fetching coffees data:', error);
    return { products: [], categoryName: 'Coffees & Teas' };
  }
}

export default async function CoffeesPage() {
  const { products, categoryName } = await getCoffeesData();

  return (
    <CategoryPage 
      products={products}
      categoryName={categoryName}
      searchPlaceholder="Search drinks..."
      emptyStateTitle="No Drinks Available"
      emptyStateDescription="We're working on adding delicious coffee and tea options to our menu."
    />
  )
}
