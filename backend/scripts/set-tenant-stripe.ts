import { config } from 'dotenv';
import mongoose from 'mongoose';
import { Tenant } from '../src/models/Tenant.js';

config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is required');
  process.exit(1);
}

const ACCOUNT_ID = process.env.CONNECT_ACCOUNT_ID || 'acct_1SFgpED8TJhQz6vX';
const TENANT_ID = process.env.TENANT_ID || 'Bouchees';

async function run() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    let tenant = await Tenant.findById(TENANT_ID);
    if (!tenant) {
      console.log(`📝 Creating tenant ${TENANT_ID}`);
      tenant = new Tenant({ _id: TENANT_ID, name: TENANT_ID });
    }

    tenant.stripe = {
      accountId: ACCOUNT_ID,
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      onboardingCompletedAt: new Date()
    } as any;

    await tenant.save();
    console.log('✅ Tenant updated');
    console.log({ tenantId: tenant._id, stripe: tenant.stripe });
  } catch (err) {
    console.error('❌ Failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

run();


