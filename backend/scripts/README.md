# Food Products Migration Scripts

This directory contains scripts to migrate the 6 food products from the static `page.tsx` to the Bouchees tenant in the database.

## Scripts

### 1. `migrate-food-products.js` - Main Migration Script
Migrates all 6 food products from the static page to the Bouchees tenant with image uploads.

**Products migrated:**
- Vegetarian Breakfast ($22.00)
- Smoked Salmon Wrap ($21.00) 
- Breakfast Sandwich ($19.50)
- Breakfast Bowl ($18.00)
- Garden Salad ($16.00)
- Artisan Pizza ($24.00)

### 2. `test-products.js` - API Test Script
Tests the API endpoints to verify products were created successfully.

## Prerequisites

1. **Environment Variables**: Create a `.env` file in the backend directory with:
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Then update the `.env` file with your actual values:
   - `MONGODB_URI` - MongoDB connection string (e.g., `mongodb://localhost:27017/cafe-website`)
   - `SUPABASE_JWT_SECRET` - Your Supabase JWT secret
   - `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
   - `CLOUDINARY_API_KEY` - Cloudinary API key
   - `CLOUDINARY_API_SECRET` - Cloudinary API secret

2. **Dependencies**: Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. **MongoDB**: Make sure MongoDB is running locally or update `MONGODB_URI` to point to your MongoDB instance

4. **Images**: Ensure the food images exist in the `public/` directory:
   - `food-1.jpg` through `food-6.jpg`

## Running the Migration

### Step 1: Create Products (Simple Version)
```bash
cd backend
npm run migrate:food:simple
```

### Step 2: Upload Images
```bash
cd backend
npm run upload:images
```

### Step 3: Verify Results
```bash
cd backend
npm run test:products
```

### Alternative: Full Migration (if you have proper env setup)
```bash
cd backend
npm run migrate:food
```

## Testing the Results

After running the migration, test the API:

```bash
cd backend
node scripts/test-products.js
```

Or manually test the API endpoint:
```bash
curl http://localhost:4000/api/tenants/bouchees/products
```

## What the Script Does

1. **Creates Bouchees Tenant**: Creates a tenant with ID `bouchees` if it doesn't exist
2. **Creates Categories**: Creates categories (Breakfast, Food, Drinks, Coffee) for the tenant
3. **Creates Products**: Creates all 6 food products with proper pricing and descriptions
4. **Uploads Images**: Uploads each food image to Cloudinary and links it to the product
5. **Handles Duplicates**: Skips products that already exist to avoid duplicates

## Expected Output

```
Connecting to database...
✅ Bouchees tenant found
✅ Found category: Breakfast
✅ Found category: Food
✅ Found category: Drinks
✅ Found category: Coffee

Processing: Vegetarian Breakfast
✅ Created product: Vegetarian Breakfast with image

Processing: Smoked Salmon Wrap
✅ Created product: Smoked Salmon Wrap with image

...

🎉 Migration completed successfully!
Created 6 products for Bouchees tenant
```

## Troubleshooting

- **Image upload fails**: Check that images exist in `public/` directory
- **Database connection fails**: Verify `MONGODB_URI` in `.env`
- **Cloudinary upload fails**: Verify Cloudinary credentials in `.env`
- **Products already exist**: The script will skip existing products safely
