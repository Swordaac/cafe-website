import { CategoryPage } from "@/components/CategoryPage"
import { fetchProductsByCategory, fetchCategories } from "@/lib/api"

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic'

async function getPuffsData() {
  try {
    const [products, categories] = await Promise.all([
      fetchProductsByCategory('Bouchees', 'puffs'),
      fetchCategories('Bouchees')
    ]);
    
    // Find the puffs category ID
    const puffsCategory = categories.find(cat => 
      cat.name.toLowerCase().includes('puff') || 
      cat.name.toLowerCase().includes('pastry') ||
      cat.name.toLowerCase().includes('baked')
    );
    
    return { 
      products, 
      categoryName: 'Puffs',
      categoryId: puffsCategory?._id
    };
  } catch (error) {
    console.error('Error fetching puffs data:', error);
    return { products: [], categoryName: 'Puffs', categoryId: undefined };
  }
}

export default async function PuffsPage() {
  const { products, categoryName, categoryId } = await getPuffsData();

  return (
    <CategoryPage 
      products={products}
      categoryName={categoryName}
      categoryId={categoryId}
      searchPlaceholder="Search puffs..."
      emptyStateTitle="No Puffs Available"
      emptyStateDescription="We're working on adding delicious puffs to our menu."
    />
  )
}
