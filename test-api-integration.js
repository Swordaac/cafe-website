// Test script to verify API integration
const API_BASE_URL = 'http://localhost:4000/v1';

async function testAPI() {
  try {
    console.log('🧪 Testing API integration...\n');
    
    // Test products endpoint
    console.log('📦 Fetching products...');
    const productsResponse = await fetch(`${API_BASE_URL}/tenants/Bouchees/products`);
    const productsData = await productsResponse.json();
    
    if (productsResponse.ok) {
      console.log(`✅ Products API working - Found ${productsData.data.length} products`);
      productsData.data.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - $${(product.priceCents / 100).toFixed(2)}`);
      });
    } else {
      console.log('❌ Products API failed:', productsData);
    }
    
    console.log('\n📂 Fetching categories...');
    const categoriesResponse = await fetch(`${API_BASE_URL}/tenants/Bouchees/categories`);
    const categoriesData = await categoriesResponse.json();
    
    if (categoriesResponse.ok) {
      console.log(`✅ Categories API working - Found ${categoriesData.data.length} categories`);
      categoriesData.data.forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name}`);
      });
    } else {
      console.log('❌ Categories API failed:', categoriesData);
    }
    
    console.log('\n🎉 API integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();


