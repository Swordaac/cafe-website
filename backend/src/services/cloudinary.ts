import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  format: string;
  width: number;
  height: number;
}

class CloudinaryService {
  private sanitizeTenantId(tenantId: string): string {
    // Remove any special characters and spaces from tenantId
    return tenantId.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  async uploadImage(
    file: Express.Multer.File,
    tenantId: string,
    productId: string
  ): Promise<CloudinaryUploadResult> {
    try {
      const sanitizedTenantId = this.sanitizeTenantId(tenantId);
      const folderPath = `tenants/${sanitizedTenantId}/products`;
      
      console.log('=== CLOUDINARY UPLOAD DEBUG ===');
      console.log('Original tenantId:', tenantId);
      console.log('Sanitized tenantId:', sanitizedTenantId);
      console.log('ProductId:', productId);
      console.log('Folder path:', folderPath);
      console.log('File path:', file.path);
      console.log('File size:', file.size);
      console.log('File mimetype:', file.mimetype);

      const uploadOptions = {
        upload_preset: 'tenant_products', // Use the preset
        public_id: productId, // Simple product ID
        folder: folderPath, // Override the preset's empty asset folder
        tags: [tenantId, productId],
        overwrite: true,
        invalidate: true,
      };

      console.log('Upload options:', JSON.stringify(uploadOptions, null, 2));

      const result = await cloudinary.uploader.upload(file.path, uploadOptions);

      console.log('=== UPLOAD RESULT ===');
      console.log('Public ID:', result.public_id);
      console.log('Secure URL:', result.secure_url);
      console.log('Folder:', result.folder);
      console.log('Asset folder:', result.asset_folder);
      console.log('Original filename:', result.original_filename);
      console.log('Format:', result.format);
      console.log('Width:', result.width);
      console.log('Height:', result.height);
      console.log('Bytes:', result.bytes);
      console.log('Created at:', result.created_at);

      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      console.error('=== CLOUDINARY UPLOAD ERROR ===');
      console.error('Error details:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      console.log('=== CLOUDINARY DELETE DEBUG ===');
      console.log('Deleting publicId:', publicId);
      
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true // Invalidate CDN cache
      });
      console.log('Delete result:', result);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  async updateImage(
    file: Express.Multer.File,
    tenantId: string,
    productId: string
  ): Promise<CloudinaryUploadResult> {
    console.log('=== CLOUDINARY UPDATE DEBUG ===');
    console.log('Updating image for productId:', productId);
    console.log('For tenantId:', tenantId);
    
    // For updates, we'll use the same upload method since we set overwrite: true
    return this.uploadImage(file, tenantId, productId);
  }

  async getImagesByTenant(tenantId: string): Promise<any> {
    try {
      const sanitizedTenantId = this.sanitizeTenantId(tenantId);
      const prefix = `tenants/${sanitizedTenantId}/products/`;
      
      console.log('=== CLOUDINARY FETCH DEBUG ===');
      console.log('Fetching images for tenantId:', tenantId);
      console.log('Sanitized tenantId:', sanitizedTenantId);
      console.log('Search prefix:', prefix);

      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: prefix,
        max_results: 500,
      });

      console.log('Fetch result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error('Cloudinary fetch error:', error);
      throw new Error('Failed to fetch images from Cloudinary');
    }
  }

  // Method to check account configuration
  async getAccountInfo(): Promise<any> {
    try {
      console.log('=== CLOUDINARY ACCOUNT INFO ===');
      const result = await cloudinary.api.ping();
      console.log('Ping result:', result);
      
      // Try to get account details
      const accountResult = await cloudinary.api.usage();
      console.log('Account info:', JSON.stringify(accountResult, null, 2));
      return accountResult;
    } catch (error) {
      console.error('Error getting account info:', error);
      return null;
    }
  }
}

export const cloudinaryService = new CloudinaryService();