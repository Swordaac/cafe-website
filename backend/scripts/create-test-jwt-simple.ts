import { SignJWT } from 'jose';
import dotenv from 'dotenv';

// Load only the JWT secret
dotenv.config();
const jwtSecret = process.env.SUPABASE_JWT_SECRET;

if (!jwtSecret) {
  console.error('SUPABASE_JWT_SECRET not found in .env file');
  process.exit(1);
}

async function createTestJWT() {
  const secret = new TextEncoder().encode(jwtSecret);
  
  const jwt = await new SignJWT({
    sub: 'test-user-123',
    email: 'test@example.com',
    role: 'admin',
    tenant_id: 'test-tenant'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  console.log('Test JWT created:');
  console.log(jwt);
  console.log('\nUse this in your Authorization header:');
  console.log(`Authorization: Bearer ${jwt}`);
  console.log('\nThis JWT is valid for 24 hours and includes:');
  console.log('- User ID: test-user-123');
  console.log('- Email: test@example.com');
  console.log('- Role: admin');
  console.log('- Tenant ID: test-tenant');
}

createTestJWT().catch(console.error);
