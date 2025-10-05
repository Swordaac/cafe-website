import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Define schemas
const productSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  name: { type: String, required: true },
  description: { type: String },
  priceCents: { type: Number, required: true, min: 0 },
  imageUrl: { type: String },
  imagePublicId: { type: String },
  imageMetadata: {
    width: { type: Number },
    height: { type: Number },
    format: { type: String }
  },
  availabilityStatus: { type: String, enum: ['available', 'unavailable', 'archived'], default: 'available' },
}, { timestamps: true, versionKey: false });

const categorySchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  sortOrder: { type: Number },
}, { timestamps: true, versionKey: false });

const Product = mongoose.model('Product', productSchema);
const Category = mongoose.model('Category', categorySchema);

async function testProducts() {
  try {
    console.log('Connecting to database...');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const tenantId = 'Bouchees';
    
    // Get all products for Bouchees tenant
    const products = await Product.find({ tenantId }).populate('categoryId').lean();
    
    console.log(`\n📊 Found ${products.length} products for Bouchees tenant:\n`);
    
    // Group by category
    const productsByCategory = products.reduce((acc, product) => {
      const categoryName = product.categoryId?.name || 'No Category';
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Display products by category
    Object.entries(productsByCategory).forEach(([categoryName, categoryProducts]) => {
      console.log(`🍽️  ${categoryName} (${categoryProducts.length} items):`);
      categoryProducts.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name}`);
        console.log(`      Price: $${(product.priceCents / 100).toFixed(2)}`);
        console.log(`      Status: ${product.availabilityStatus}`);
        if (product.imageUrl) {
          console.log(`      Image: ✅ ${product.imageUrl}`);
        } else {
          console.log(`      Image: ❌ No image`);
        }
        console.log(`      Description: ${product.description?.substring(0, 80)}...`);
        console.log('');
      });
    });
    
    // Summary
    const withImages = products.filter(p => p.imageUrl).length;
    const withoutImages = products.length - withImages;
    
    console.log('📈 Summary:');
    console.log(`   Total products: ${products.length}`);
    console.log(`   With images: ${withImages}`);
    console.log(`   Without images: ${withoutImages}`);
    console.log(`   Categories: ${Object.keys(productsByCategory).length}`);
    
    console.log('\n🎉 Database verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the test
testProducts();
