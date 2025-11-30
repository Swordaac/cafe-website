import 'dotenv/config';
import { connectToDatabase } from '../src/db/mongoose.js';
import { Loyalty } from '../src/models/Loyalty.js';
import { Transaction } from '../src/models/Transaction.js';
import { StripeEvent } from '../src/models/StripeEvent.js';

async function debugLoyalty() {
  try {
    await connectToDatabase();
    console.log('✅ Connected to database\n');

    // Get user ID from command line or use the one from the issue
    const userId = process.argv[2] || 'c6ce9efd-68f0-4c4f-b791-f39ee199c970';
    const tenantId = process.argv[3] || 'Bouchees';

    console.log('🔍 Debugging loyalty for:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Tenant ID: ${tenantId}\n`);

    // Check loyalty record
    console.log('📊 Loyalty Record:');
    const loyalty = await Loyalty.findOne({ userId, tenantId });
    if (loyalty) {
      console.log(JSON.stringify(loyalty.toObject(), null, 2));
    } else {
      console.log('   ❌ No loyalty record found\n');
    }

    // Check recent transactions
    console.log('\n💳 Recent Transactions:');
    const transactions = await Transaction.find({ tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    if (transactions.length > 0) {
      transactions.forEach((tx, index) => {
        console.log(`\n   Transaction ${index + 1}:`);
        console.log(`   - ID: ${tx._id}`);
        console.log(`   - Status: ${tx.status}`);
        console.log(`   - Amount: ${tx.amount}`);
        console.log(`   - Metadata:`, tx.metadata);
        console.log(`   - Created: ${tx.createdAt}`);
      });
    } else {
      console.log('   ❌ No transactions found');
    }

    // Check webhook events
    console.log('\n\n📨 Recent Webhook Events:');
    const webhookEvents = await StripeEvent.find({
      type: { $in: ['payment_intent.succeeded', 'payment_intent.payment_failed'] }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (webhookEvents.length > 0) {
      webhookEvents.forEach((event, index) => {
        console.log(`\n   Event ${index + 1}:`);
        console.log(`   - ID: ${event._id}`);
        console.log(`   - Type: ${event.type}`);
        console.log(`   - Processed: ${event.processedAt ? 'Yes' : 'No'}`);
        console.log(`   - Created: ${event.createdAt}`);
        
        // Try to extract metadata from payload
        if (event.payload && typeof event.payload === 'object') {
          const payload = event.payload as any;
          if (payload.data?.object?.metadata) {
            console.log(`   - Metadata:`, payload.data.object.metadata);
          }
        }
      });
    } else {
      console.log('   ❌ No webhook events found');
    }

    // Check for transactions with this user's metadata
    console.log('\n\n🔎 Transactions with User Metadata:');
    const userTransactions = await Transaction.find({
      tenantId,
      'metadata.userId': userId
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (userTransactions.length > 0) {
      userTransactions.forEach((tx, index) => {
        console.log(`\n   Transaction ${index + 1}:`);
        console.log(`   - ID: ${tx._id}`);
        console.log(`   - Status: ${tx.status}`);
        console.log(`   - Metadata:`, tx.metadata);
      });
    } else {
      console.log('   ❌ No transactions found with this userId in metadata');
    }

    console.log('\n\n✅ Debug complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugLoyalty();

