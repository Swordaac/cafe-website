import { Router } from 'express';
import type {} from '../types/express.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { authSupabase } from '../middlewares/authSupabase.js';
import { tenantFromParam, tenantParamMatchesJwt } from '../middlewares/tenant.js';
import { ensureTenantExists, loadMembership } from '../middlewares/membership.js';
import { authorize } from '../middlewares/authorize.js';
import { upload } from '../middlewares/upload.js';
import { cloudinaryService } from '../services/cloudinary.js';
import fs from 'fs/promises';

export const router = Router({ mergeParams: true });

// Handle OPTIONS requests for CORS preflight
router.options('*', (req, res) => {
  res.status(200).end();
});

// For all routes, ensure tenant id from params exists
// Skip tenant validation for OPTIONS requests (CORS preflight)
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  return tenantFromParam(req, res, next);
}, ensureTenantExists);

// Create product
router.post('/', 
  authSupabase, 
  tenantParamMatchesJwt, 
  loadMembership, 
  authorize(['editor', 'admin']),
  upload.single('image'),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).tenant!.id;
      const name = req.body.name;
      const description = req.body.description;
      const priceCents = req.body.priceCents ? parseInt(req.body.priceCents, 10) : undefined;
      const categoryId = req.body.categoryId;
      const availabilityStatus = req.body.availabilityStatus || 'available';

      // Validate required fields
      if (!name || !priceCents) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: {
            name: !name ? 'Name is required' : undefined,
            priceCents: !priceCents ? 'Price is required' : undefined
          }
        });
      }
      
      // Ensure referenced category (if provided) belongs to same tenant
      if (categoryId) {
        const category = await Category.findOne({ _id: categoryId, tenantId }).lean();
        if (!category) return res.status(400).json({ error: 'Invalid category for tenant' });
      }

      // Create product first to get the ID
      const product = await Product.create({ 
        tenantId, 
        categoryId, 
        name, 
        description, 
        priceCents, 
        availabilityStatus 
      });

      // Handle image upload if provided
      if (req.file) {
        try {
          const uploadResult = await cloudinaryService.uploadImage(req.file, tenantId, product._id.toString());
          
          // Update product with image information
          product.imageUrl = uploadResult.url;
          product.imagePublicId = uploadResult.publicId;
          product.imageMetadata = {
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format
          };
          await product.save();

          // Clean up temporary file
          await fs.unlink(req.file.path);
        } catch (uploadError) {
          // If image upload fails, delete the product and propagate error
          await Product.findByIdAndDelete(product._id);
          throw uploadError;
        }
      }

      res.status(201).json({ data: product });
    } catch (error) {
      // Clean up temporary file if it exists
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return next(error);
    }
});

// List products (optionally by category and search)
router.get('/', async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { categoryId, search } = req.query as { categoryId?: string; search?: string };
    const filter: any = { tenantId };
    
    if (categoryId) filter.categoryId = categoryId;
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(filter).lean();
    res.json({ data: products });
  } catch (error) {
    return next(error);
  }
});

// Get single product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { id } = req.params;
    
    const product = await Product.findOne({ _id: id, tenantId }).lean();
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ data: product });
  } catch (error) {
    return next(error);
  }
});

// Update product
router.put('/:id', 
  authSupabase, 
  tenantParamMatchesJwt, 
  loadMembership, 
  authorize(['editor', 'admin']),
  upload.single('image'),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).tenant!.id;
      const { id } = req.params;
      // Build update object from form data
      const update: any = {};
      
      if (req.body.name) update.name = req.body.name;
      if (req.body.description !== undefined) update.description = req.body.description;
      if (req.body.priceCents) update.priceCents = parseInt(req.body.priceCents, 10);
      if (req.body.categoryId) update.categoryId = req.body.categoryId;
      if (req.body.availabilityStatus) update.availabilityStatus = req.body.availabilityStatus;

      // Find the existing product
      const existingProduct = await Product.findOne({ _id: id, tenantId });
      if (!existingProduct) return res.status(404).json({ error: 'Not found' });

      // Check category if being updated
      if (update.categoryId) {
        const category = await Category.findOne({ _id: update.categoryId, tenantId }).lean();
        if (!category) return res.status(400).json({ error: 'Invalid category for tenant' });
      }

      // Validate required fields if they're being updated
      if (update.name === '') {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }
      if (update.priceCents !== undefined && isNaN(update.priceCents)) {
        return res.status(400).json({ error: 'Invalid price format' });
      }

      // Handle image update if provided
      if (req.file) {
        try {
          const uploadResult = await cloudinaryService.updateImage(req.file, tenantId, id);
          
          // Update image information
          update.imageUrl = uploadResult.url;
          update.imagePublicId = uploadResult.publicId;
          update.imageMetadata = {
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format
          };

          // Clean up temporary file
          await fs.unlink(req.file.path);
        } catch (uploadError) {
          throw uploadError;
        }
      }

      // Update the product
      const updated = await Product.findOneAndUpdate(
        { _id: id, tenantId }, 
        update, 
        { new: true }
      );

      res.json({ data: updated });
    } catch (error) {
      // Clean up temporary file if it exists
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return next(error);
    }
});

// Delete product
// Delete product
router.delete('/:id', authSupabase, tenantParamMatchesJwt, loadMembership, authorize('admin'), async (req, res, next) => {
    try {
      const tenantId = (req as any).tenant!.id;
      const { id } = req.params;
  
      // Find the product first to get image info
      const product = await Product.findOne({ _id: id, tenantId });
      if (!product) return res.status(404).json({ error: 'Not found' });
  
      // Delete from Cloudinary if image exists
      if (product.imagePublicId) {
        try {
          console.log('Deleting image with publicId:', product.imagePublicId);
          await cloudinaryService.deleteImage(product.imagePublicId);
          console.log('Successfully deleted image from Cloudinary');
        } catch (deleteError) {
          console.error('Failed to delete image from Cloudinary:', deleteError);
          // Continue with product deletion even if image deletion fails
        }
      } else {
        console.log('No image to delete for product:', id);
      }
  
      // Delete the product
      await product.deleteOne();
      console.log('Successfully deleted product:', id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      return next(error);
    }
  });
