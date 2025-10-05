import { ProductsResponse, CategoriesResponse, Product, Category } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

export async function fetchProducts(tenantId: string, categoryId?: string, searchTerm?: string): Promise<Product[]> {
  try {
    const url = new URL(`${API_BASE_URL}/tenants/${tenantId}/products`);
    if (categoryId) {
      url.searchParams.set('categoryId', categoryId);
    }
    if (searchTerm) {
      url.searchParams.set('search', searchTerm);
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
    }

    const data: ProductsResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export async function fetchProductsByCategory(tenantId: string, categoryName: string): Promise<Product[]> {
  try {
    // First get all categories to find the one matching the category name
    const categories = await fetchCategories(tenantId);
    const category = categories.find(cat => 
      cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(cat.name.toLowerCase())
    );
    
    if (category) {
      return await fetchProducts(tenantId, category._id);
    }
    
    // If no exact category match, try to filter by product name patterns
    const allProducts = await fetchProducts(tenantId);
    return filterProductsByCategoryName(allProducts, categoryName);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
}

function filterProductsByCategoryName(products: Product[], categoryName: string): Product[] {
  const lowerCategoryName = categoryName.toLowerCase();
  
  // Define keyword patterns for each category
  const patterns: Record<string, string[]> = {
    'puffs': ['puff', 'pastry', 'baked', 'flaky'],
    'stuffed puffs': ['stuffed', 'filled', 'savory', 'meat', 'cheese'],
    'coffees': ['coffee', 'tea', 'latte', 'cappuccino', 'espresso', 'americano', 'mocha', 'frappe'],
    'ice cream': ['ice cream', 'gelato', 'sorbet', 'frozen', 'dessert', 'sundae'],
    'merchandise': ['shirt', 'mug', 'cup', 'bag', 'hat', 'hoodie', 'merchandise', 'apparel']
  };
  
  const keywords = patterns[lowerCategoryName] || [lowerCategoryName];
  
  return products.filter(product => 
    keywords.some(keyword => 
      product.name.toLowerCase().includes(keyword) ||
      product.description?.toLowerCase().includes(keyword)
    )
  );
}

export async function fetchCategories(tenantId: string): Promise<Category[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenants/${tenantId}/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
    }

    const data: CategoriesResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}
