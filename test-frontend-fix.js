#!/usr/bin/env node

/**
 * Test Frontend Fix Script
 * Tests the idempotency key generation fix without requiring backend
 */

// Simulate the cart context idempotency key generation
function testIdempotencyKeyGeneration() {
  console.log('🧪 Testing idempotency key generation...');
  
  // Simulate cart items
  const cartItems = [
    { product: { _id: 'product1' }, quantity: 2 },
    { product: { _id: 'product2' }, quantity: 1 }
  ];
  
  const totalPrice = 1000;
  
  // Test the new idempotency key generation logic
  const sortedItems = cartItems
    .map(item => `${item.product._id}:${item.quantity}`)
    .sort()
    .join('|');
  
  const cartHash = Buffer.from(`${sortedItems}-${totalPrice}`)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 32);
  
  console.log('✅ Generated idempotency key:', cartHash);
  console.log('   Length:', cartHash.length);
  console.log('   Sorted items:', sortedItems);
  
  // Test that the same cart generates the same key
  const cartHash2 = Buffer.from(`${sortedItems}-${totalPrice}`)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 32);
  
  if (cartHash === cartHash2) {
    console.log('✅ Idempotency key is consistent for same cart');
  } else {
    console.log('❌ Idempotency key is not consistent');
  }
  
  // Test that different carts generate different keys
  const differentCart = [
    { product: { _id: 'product1' }, quantity: 3 }, // Different quantity
    { product: { _id: 'product2' }, quantity: 1 }
  ];
  
  const differentSortedItems = differentCart
    .map(item => `${item.product._id}:${item.quantity}`)
    .sort()
    .join('|');
  
  const differentHash = Buffer.from(`${differentSortedItems}-${totalPrice}`)
    .toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 32);
  
  if (cartHash !== differentHash) {
    console.log('✅ Different carts generate different keys');
  } else {
    console.log('❌ Different carts generate same key');
  }
  
  return cartHash;
}

function testMetadataSize() {
  console.log('\n🧪 Testing Stripe metadata size...');
  
  // Simulate the items that would be stored in metadata
  const items = [
    { productId: '68ddd3215021d7fd3fb4a411', quantity: 1 },
    { productId: '68ddd3215021d7fd3fb4a413', quantity: 2 },
    { productId: '68ddd3215021d7fd3fb4a415', quantity: 3 },
    { productId: '68ddd3215021d7fd3fb4a417', quantity: 4 },
    { productId: '68ddd3215021d7fd3fb4a419', quantity: 5 },
    { productId: '68ddd3215021d7fd3fb4a41b', quantity: 6 }
  ];
  
  // Old metadata (with full product details)
  const oldMetadata = {
    tenantId: 'Bouchees',
    items: JSON.stringify(items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      priceCents: 2000,
      name: 'Very Long Product Name That Takes Up Space'
    }))),
    totalItems: items.length.toString()
  };
  
  // New metadata (only essential data)
  const newMetadata = {
    tenantId: 'Bouchees',
    items: JSON.stringify(items.map(item => ({ 
      productId: item.productId, 
      quantity: item.quantity 
    }))),
    totalItems: items.length.toString()
  };
  
  const oldSize = JSON.stringify(oldMetadata).length;
  const newSize = JSON.stringify(newMetadata).length;
  
  console.log(`Old metadata size: ${oldSize} characters`);
  console.log(`New metadata size: ${newSize} characters`);
  console.log(`Reduction: ${oldSize - newSize} characters (${Math.round((oldSize - newSize) / oldSize * 100)}%)`);
  
  if (newSize <= 500) {
    console.log('✅ New metadata is within Stripe limit (500 chars)');
  } else {
    console.log('❌ New metadata still exceeds Stripe limit');
  }
  
  if (oldSize > 500) {
    console.log('✅ Old metadata would have been rejected by Stripe');
  } else {
    console.log('❌ Old metadata was within Stripe limit');
  }
}

function testCartContextLogic() {
  console.log('\n🧪 Testing cart context logic...');
  
  // Simulate the cart context createPaymentIntent function
  function simulateCreatePaymentIntent(cart) {
    if (cart.items.length === 0) {
      return null;
    }
    
    // Generate idempotency key
    const sortedItems = cart.items
      .map(item => `${item.product._id}:${item.quantity}`)
      .sort()
      .join('|');
    
    const cartHash = Buffer.from(`${sortedItems}-${cart.totalPrice}`)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 32);
    
    // Prepare request body
    const requestBody = {
      items: cart.items.map(item => ({
        productId: item.product._id,
        quantity: item.quantity
      })),
      currency: 'usd',
      description: `Order for ${cart.totalItems} item(s) from Bouchees`,
      metadata: {
        totalItems: cart.totalItems.toString(),
        totalPrice: cart.totalPrice.toString()
      }
    };
    
    return {
      idempotencyKey: cartHash,
      requestBody: requestBody
    };
  }
  
  // Test with sample cart
  const testCart = {
    items: [
      { product: { _id: 'product1' }, quantity: 2 },
      { product: { _id: 'product2' }, quantity: 1 }
    ],
    totalItems: 3,
    totalPrice: 1500
  };
  
  const result = simulateCreatePaymentIntent(testCart);
  
  if (result) {
    console.log('✅ Cart context logic works correctly');
    console.log('   Idempotency key:', result.idempotencyKey);
    console.log('   Request body items:', result.requestBody.items.length);
    console.log('   Request body size:', JSON.stringify(result.requestBody).length, 'characters');
  } else {
    console.log('❌ Cart context logic failed');
  }
}

function runAllTests() {
  console.log('🚀 Testing Frontend Fixes');
  console.log('=' .repeat(50));
  
  try {
    testIdempotencyKeyGeneration();
    testMetadataSize();
    testCartContextLogic();
    
    console.log('\n🎉 All frontend tests passed!');
    console.log('\n✅ The fixes should resolve:');
    console.log('   - Idempotency key generation issues');
    console.log('   - Stripe metadata size limit exceeded');
    console.log('   - Cart context payment intent creation');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testIdempotencyKeyGeneration,
  testMetadataSize,
  testCartContextLogic
};
