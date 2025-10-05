import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables FIRST
dotenv.config();

// Import mongoose directly
import mongoose from 'mongoose';

// Define schemas directly to avoid env.ts dependency
const tenantSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  domain: { type: String },
}, { timestamps: true, versionKey: false });

const categorySchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  sortOrder: { type: Number },
}, { timestamps: true, versionKey: false });

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

// Create models
const Tenant = mongoose.model('Tenant', tenantSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

// Food products data from page.tsx
const foodProducts = [
  {
    name: 'Vegetarian Breakfast',
    description: 'Roasted red pepper with goat cheese, avocado, cherry tomato, spinach with a fried egg on top.\n\nPlease inform staff of any food allergies or intolerances.',
    priceCents: 2200, // $22.00
    imagePath: '/food-1.jpg',
    category: 'Breakfast'
  },
  {
    name: 'Smoked Salmon Wrap',
    description: 'Fresh smoked salmon, cream cheese, capers, red onion, rocket, cherry tomato.\n\nCoffee served with soy, oat or full cream milk available on request.',
    priceCents: 2100, // $21.00
    imagePath: '/food-2.jpg',
    category: 'Breakfast'
  },
  {
    name: 'Breakfast Sandwich',
    description: 'Smoked ham and fresh avocado, tomatoes, greens, and grilled, wrapped in a tortilla.\n\nFreshly baked daily, made of our fresh and crisp daily for an enhanced experience.',
    priceCents: 1950, // $19.50
    imagePath: '/food-3.jpg',
    category: 'Breakfast'
  },
  {
    name: 'Breakfast Bowl',
    description: 'Fresh seasonal vegetables, quinoa, avocado, poached egg, with tahini dressing.',
    priceCents: 1800, // $18.00
    imagePath: '/food-4.jpg',
    category: 'Breakfast'
  },
  {
    name: 'Garden Salad',
    description: 'Mixed greens, cherry tomatoes, cucumber, red onion, with house vinaigrette.',
    priceCents: 1600, // $16.00
    imagePath: '/food-5.jpg',
    category: 'Food'
  },
  {
    name: 'Artisan Pizza',
    description: 'Wood-fired pizza with fresh mozzarella, basil, and seasonal toppings.',
    priceCents: 2400, // $24.00
    imagePath: '/food-6.jpg',
    category: 'Food'
  }
];

async function migrateFoodProducts() {
  try {
    console.log('Connecting to database...');
    
    // Connect to MongoDB using the environment variable
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Create or find Bouchees tenant
    const tenantId = 'Bouchees';
    let tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      console.log('Creating Bouchees tenant...');
      tenant = await Tenant.create({
        _id: tenantId,
        name: 'Bouchees',
        domain: 'bouchees.localhost'
      });
      console.log('✅ Bouchees tenant created');
    } else {
      console.log('✅ Bouchees tenant found');
    }

    // Create categories
    const categories = ['Breakfast', 'Food', 'Drinks', 'Coffee'];
    const categoryMap = new Map();
    
    for (const categoryName of categories) {
      let category = await Category.findOne({ tenantId, name: categoryName });
      if (!category) {
        category = await Category.create({
          tenantId,
          name: categoryName,
          sortOrder: categories.indexOf(categoryName)
        });
        console.log(`✅ Created category: ${categoryName}`);
      } else {
        console.log(`✅ Found category: ${categoryName}`);
      }
      categoryMap.set(categoryName, category._id);
    }

    // Process each food product
    for (const productData of foodProducts) {
      console.log(`\nProcessing: ${productData.name}`);
      
      // Check if product already exists
      const existingProduct = await Product.findOne({ 
        tenantId, 
        name: productData.name 
      });
      
      if (existingProduct) {
        console.log(`⚠️  Product already exists: ${productData.name}`);
        continue;
      }

      // Create product
      const product = await Product.create({
        tenantId,
        categoryId: categoryMap.get(productData.category),
        name: productData.name,
        description: productData.description,
        priceCents: productData.priceCents,
        availabilityStatus: 'available'
      });

      console.log(`✅ Created product: ${productData.name} (without image for now)`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`Created ${foodProducts.length} products for Bouchees tenant`);
    console.log('\nNote: Images were not uploaded. You can upload them later using the API.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the migration
migrateFoodProducts();
