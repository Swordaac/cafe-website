import { Router } from 'express';
import type {} from '../types/express.js';
import { Category } from '../models/Category.js';
import { authSupabase } from '../middlewares/authSupabase.js';
import { tenantFromParam } from '../middlewares/tenant.js';
import { ensureTenantExists, loadMembership } from '../middlewares/membership.js';
import { authorize } from '../middlewares/authorize.js';
import { resolveTenantStrict } from '../middlewares/tenantStrict.js';
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

// Create category (Protected)
router.post('/', 
  authSupabase, 
  resolveTenantStrict, 
  ensureTenantExists, 
  loadMembership, 
  authorize(['editor', 'admin']), 
  upload.single('image'),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).tenant!.id;
      const { name, sortOrder } = req.body ?? {};
      if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name is required' });
      if (sortOrder != null && typeof sortOrder !== 'number') return res.status(400).json({ error: 'sortOrder must be a number' });
      
      // Create category first to get the ID
      const category = await Category.create({ tenantId, name, sortOrder });

      // Handle image upload if provided
      if (req.file) {
        try {
          const uploadResult = await cloudinaryService.uploadCategoryImage(req.file, tenantId, category._id.toString());
          
          // Update category with image information
          category.imageUrl = uploadResult.url;
          category.imagePublicId = uploadResult.publicId;
          category.imageMetadata = {
            width: uploadResult.width,
            height: uploadResult.height,
            format: uploadResult.format
          };
          await category.save();

          // Clean up temporary file
          await fs.unlink(req.file.path);
        } catch (uploadError) {
          // If image upload fails, delete the category and propagate error
          await Category.findByIdAndDelete(category._id);
          throw uploadError;
        }
      }

      res.status(201).json({ data: category });
    } catch (error: any) {
      // Clean up temporary file if it exists
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      if (error?.code === 11000) return res.status(409).json({ error: 'Category already exists' });
      return next(error);
    }
  }
);

// List categories (Public)
router.get('/', async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const categories = await Category.find({ tenantId }).sort({ sortOrder: 1, name: 1 }).lean();
    res.json({ data: categories });
  } catch (error) {
    return next(error);
  }
});

// Get single category by ID (Public)
router.get('/:id', async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { id } = req.params;
    
    const category = await Category.findOne({ _id: id, tenantId }).lean();
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ data: category });
  } catch (error) {
    return next(error);
  }
});

// Update category (Protected)
router.put('/:id', 
  authSupabase, 
  resolveTenantStrict, 
  ensureTenantExists, 
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
      if (req.body.sortOrder !== undefined) update.sortOrder = parseInt(req.body.sortOrder, 10);

      // Find the existing category
      const existingCategory = await Category.findOne({ _id: id, tenantId });
      if (!existingCategory) return res.status(404).json({ error: 'Not found' });

      // Handle image update if provided
      if (req.file) {
        try {
          const uploadResult = await cloudinaryService.updateCategoryImage(req.file, tenantId, id);
          
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

      // Update the category
      const updated = await Category.findOneAndUpdate({ _id: id, tenantId }, update, { new: true });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json({ data: updated });
    } catch (error) {
      // Clean up temporary file if it exists
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return next(error);
    }
  }
);

// Delete category (Protected)
router.delete('/:id', authSupabase, resolveTenantStrict, ensureTenantExists, loadMembership, authorize('admin'), async (req, res, next) => {
  try {
    const tenantId = (req as any).tenant!.id;
    const { id } = req.params;

    // Find the category first to get image info
    const category = await Category.findOne({ _id: id, tenantId });
    if (!category) return res.status(404).json({ error: 'Not found' });

    // Delete from Cloudinary if image exists
    if (category.imagePublicId) {
      try {
        console.log('Deleting category image with publicId:', category.imagePublicId);
        await cloudinaryService.deleteImage(category.imagePublicId);
        console.log('Successfully deleted category image from Cloudinary');
      } catch (deleteError) {
        console.error('Failed to delete category image from Cloudinary:', deleteError);
        // Continue with category deletion even if image deletion fails
      }
    } else {
      console.log('No image to delete for category:', id);
    }

    // Delete the category
    await category.deleteOne();
    console.log('Successfully deleted category:', id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    return next(error);
  }
});


