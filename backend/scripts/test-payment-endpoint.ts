import { config } from 'dotenv';

// Load environment variables
config({ path: '../.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TENANT_ID = process.env.TEST_TENANT_ID || 'test-cafe-123';

async function testPaymentEndpoint() {
  console.log('🧪 Testing payment endpoint...\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}\n`);

  const testPaymentData = {
    amount: 2000, // $20.00
    currency: 'usd',
    description: 'Test payment from script',
    metadata: { 
      orderId: 'test-' + Date.now(),
      source: 'test-script'
    }
  };

  try {
    console.log('📤 Sending payment intent request...');
    console.log('Request data:', JSON.stringify(testPaymentData, null, 2));
    console.log('');

    const response = await fetch(`${API_BASE_URL}/v1/payments/intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': TENANT_ID,
        'Idempotency-Key': 'test-' + Date.now()
      },
      body: JSON.stringify(testPaymentData)
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));
    console.log('');

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Payment intent created successfully!');
      console.log('Response data:', JSON.stringify(result, null, 2));
      
      if (result.data?.clientSecret) {
        console.log('\n💡 You can use this client secret in your frontend to complete the payment.');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Payment intent creation failed!');
      console.log('Error response:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch {
        console.log('Raw error text:', errorText);
      }
    }

  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run the test
testPaymentEndpoint();
