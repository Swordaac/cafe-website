#!/bin/bash

# Setup script for food products migration
echo "Setting up environment for food products migration..."

# Check if .env already exists
if [ -f "../.env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp ../.env ../.env.backup
fi

# Create .env file
cat > ../.env << 'EOF'
# Backend Environment Variables
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/cafe-website

# Supabase
SUPABASE_JWT_SECRET=your-supabase-jwt-secret-here

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Tenant Strategy
TENANT_STRATEGY=path
TENANT_HEADER=x-tenant-id
BASE_DOMAIN=localhost

# Stripe (TEST Keys for local development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_APP_FEE_BPS=1000
STRIPE_DEFAULT_CURRENCY=usd
# Test account ID (used in development instead of fetching from database)
STRIPE_TEST_ACCOUNT_ID=acct_1SFgpED8TJhQz6vX

# Cloudinary (replace these with your actual credentials)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EOF

echo "✅ Created .env file"
echo ""
echo "⚠️  IMPORTANT: Please update the following values in ../.env:"
echo "   - MONGODB_URI_LOCAL (for local development database)"
echo "   - MONGODB_URI (for production database, or fallback if MONGODB_URI_LOCAL not set)"
echo "   - STRIPE_SECRET_KEY (use sk_test_... for local development)"
echo "   - STRIPE_WEBHOOK_SECRET (get from 'stripe listen' command)"
echo "   - STRIPE_TEST_ACCOUNT_ID (test account ID, default: acct_1SFgpED8TJhQz6vX)"
echo "   - SUPABASE_JWT_SECRET (get from your Supabase project)"
echo "   - CLOUDINARY_CLOUD_NAME (get from your Cloudinary account)"
echo "   - CLOUDINARY_API_KEY (get from your Cloudinary account)"
echo "   - CLOUDINARY_API_SECRET (get from your Cloudinary account)"
echo ""
echo "After updating .env, run: npm run migrate:food"



