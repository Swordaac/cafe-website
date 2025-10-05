import multer from 'multer';
import path from 'path';
import os from 'os';
// Configure multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use system temp directory
        cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
// File filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
// Create multer instance with configuration
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});
//# sourceMappingURL=upload.js.map