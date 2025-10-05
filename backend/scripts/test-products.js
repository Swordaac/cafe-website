import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

async function testProducts() {
  try {
    console.log('Testing Bouchees products API...\n');
    
    // Test getting products for Bouchees tenant
    const response = await fetch(`${API_BASE}/tenants/bouchees/products`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const products = data.data;
    
    console.log(`Found ${products.length} products for Bouchees tenant:\n`);
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Price: $${(product.priceCents / 100).toFixed(2)}`);
      console.log(`   Category: ${product.categoryId || 'No category'}`);
      console.log(`   Status: ${product.availabilityStatus}`);
      if (product.imageUrl) {
        console.log(`   Image: ${product.imageUrl}`);
      }
      console.log(`   Description: ${product.description?.substring(0, 100)}...`);
      console.log('');
    });
    
    console.log('✅ API test completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\nMake sure the backend server is running on port 4000');
    console.log('Run: npm run dev (in the backend directory)');
  }
}

testProducts();


