import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables FIRST
dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

const Product = mongoose.model('Product', productSchema);

// Image mapping
const imageMapping = [
  { name: 'Vegetarian Breakfast', imagePath: '/food-1.jpg' },
  { name: 'Smoked Salmon Wrap', imagePath: '/food-2.jpg' },
  { name: 'Breakfast Sandwich', imagePath: '/food-3.jpg' },
  { name: 'Breakfast Bowl', imagePath: '/food-4.jpg' },
  { name: 'Garden Salad', imagePath: '/food-5.jpg' },
  { name: 'Artisan Pizza', imagePath: '/food-6.jpg' },
];

async function uploadImages() {
  try {
    console.log('Connecting to database...');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const tenantId = 'Bouchees';
    
    // Process each product image
    for (const mapping of imageMapping) {
      console.log(`\nProcessing image for: ${mapping.name}`);
      
      // Find the product
      const product = await Product.findOne({ 
        tenantId, 
        name: mapping.name 
      });
      
      if (!product) {
        console.log(`⚠️  Product not found: ${mapping.name}`);
        continue;
      }
      
      if (product.imageUrl) {
        console.log(`⚠️  Product already has image: ${mapping.name}`);
        continue;
      }
      
      // Check if image file exists
      const imagePath = path.join(process.cwd(), '..', 'public', mapping.imagePath);
      
      try {
        await fs.access(imagePath);
        console.log(`📁 Found image: ${mapping.imagePath}`);
        
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imagePath, {
          folder: `bouchees/products/${product._id}`,
          public_id: `${product._id}`,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'fill', quality: 'auto' }
          ]
        });
        
        // Update product with image info
        product.imageUrl = uploadResult.secure_url;
        product.imagePublicId = uploadResult.public_id;
        product.imageMetadata = {
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format
        };
        await product.save();
        
        console.log(`✅ Uploaded image for: ${mapping.name}`);
        console.log(`   URL: ${uploadResult.secure_url}`);
        
      } catch (fileError) {
        console.log(`⚠️  Could not find image file: ${mapping.imagePath}`);
        console.log(`   Expected path: ${imagePath}`);
      }
    }

    console.log('\n🎉 Image upload completed!');
    
  } catch (error) {
    console.error('❌ Image upload failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the upload
uploadImages();
