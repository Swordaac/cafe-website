import { connectToDatabase } from '../src/db/mongoose.js';
import { Tenant } from '../src/models/Tenant.js';
import { Category } from '../src/models/Category.js';
import { Product } from '../src/models/Product.js';
import { cloudinaryService } from '../src/services/cloudinary.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    await connectToDatabase();
    
    // Create or find Bouchees tenant
    const tenantId = 'bouchees';
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

      // Upload image
      const imagePath = path.join(__dirname, '..', '..', 'public', productData.imagePath);
      
      try {
        // Check if image file exists
        await fs.access(imagePath);
        
        // Create a temporary file for upload
        const tempPath = `/tmp/${productData.imagePath}`;
        await fs.copyFile(imagePath, tempPath);
        
        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadImage(
          { path: tempPath, originalname: productData.imagePath },
          tenantId,
          product._id.toString()
        );
        
        // Update product with image info
        product.imageUrl = uploadResult.url;
        product.imagePublicId = uploadResult.publicId;
        product.imageMetadata = {
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format
        };
        await product.save();
        
        // Clean up temp file
        await fs.unlink(tempPath);
        
        console.log(`✅ Created product: ${productData.name} with image`);
      } catch (imageError) {
        console.log(`⚠️  Could not upload image for ${productData.name}:`, imageError.message);
        console.log(`✅ Created product without image: ${productData.name}`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`Created ${foodProducts.length} products for Bouchees tenant`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the migration
migrateFoodProducts();


