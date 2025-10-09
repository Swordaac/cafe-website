import { ProductsResponse, CategoriesResponse, Product, Category } from './types';
import { createClient } from './supabase';
import { config } from './config';

const API_BASE_URL = config.apiBaseUrl;

export type CustomFetchOptions = Omit<RequestInit, 'headers' | 'body'> & {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: HeadersInit;
  body?: any;
  tenantId?: string; // when provided, will set x-tenant-id
  auth?: boolean; // when true, will inject Authorization from Supabase session
  accessTokenOverride?: string; // optionally provide an access token directly
};

// Generic fetch helper supporting public and protected routes
export async function customFetch<T = any>(
  input: string | URL,
  options: CustomFetchOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers,
    body,
    tenantId,
    auth,
    accessTokenOverride,
    ...rest
  } = options;

  // Build absolute URL if a relative path is provided
  const url = typeof input === 'string' || input instanceof URL
    ? String(input).startsWith('http')
      ? String(input)
      : `${API_BASE_URL}${String(input).startsWith('/') ? '' : '/'}${String(input)}`
    : String(input);

  // Resolve access token if auth is requested and no override provided
  let accessToken = accessTokenOverride;
  if (auth && !accessToken) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    accessToken = session?.access_token;
    if (!accessToken) throw new Error('Not authenticated');
  }

  // Construct headers
  const mergedHeaders: HeadersInit = { ...(headers || {}) };
  if (tenantId) (mergedHeaders as any)['x-tenant-id'] = tenantId;
  if (auth && accessToken) (mergedHeaders as any)['Authorization'] = `Bearer ${accessToken}`;

  // If body is FormData, let fetch set the correct Content-Type
  let finalBody: BodyInit | undefined;
  if (body instanceof FormData) {
    finalBody = body as unknown as BodyInit;
  } else if (body !== undefined && body !== null) {
    (mergedHeaders as any)['Content-Type'] = (mergedHeaders as any)['Content-Type'] || 'application/json';
    finalBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers: mergedHeaders,
    body: finalBody,
    ...rest,
  });

  if (response.status === 204) {
    return null as unknown as T; // no content
  }

  // Try to parse JSON; if it fails, throw a generic error for non-ok responses
  let json: any = null;
  try {
    json = await response.json();
  } catch (_err) {
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return null as unknown as T;
  }

  if (!response.ok) {
    const message = json?.error || json?.message || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return json as T;
}

// Protected fetch helper that injects Authorization and x-tenant-id headers
export async function protectedFetch(
  input: string | URL,
  init: RequestInit & { tenantId: string }
): Promise<Response> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const { tenantId, headers, ...rest } = init;

  // Support relative API paths by prefixing API_BASE_URL
  const url = typeof input === 'string' || input instanceof URL
    ? String(input).startsWith('http')
      ? input
      : `${API_BASE_URL}${String(input).startsWith('/') ? '' : '/'}${String(input)}`
    : input;

  const mergedHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    'Authorization': `Bearer ${accessToken}`,
    ...(headers || {}),
  };

  return fetch(url, { ...rest, headers: mergedHeaders });
}

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
        'x-tenant-id': tenantId,
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
        'x-tenant-id': tenantId,
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
