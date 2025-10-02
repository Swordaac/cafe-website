import { useState } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  currentImageUrl?: string;
  className?: string;
}

export function ImageUploader({ onFileSelect, currentImageUrl, className = '' }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    
    if (!file) {
      setPreviewUrl(null);
      onFileSelect(null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      setPreviewUrl(null);
      onFileSelect(null);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      setPreviewUrl(null);
      onFileSelect(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass the file to parent component
    onFileSelect(file);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <label className="relative cursor-pointer">
          <div className="h-32 w-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className="text-sm text-gray-500">Click to select image</div>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>

        {(previewUrl || currentImageUrl) && (
          <div className="relative h-32 w-32 rounded-lg overflow-hidden">
            <Image
              src={previewUrl || currentImageUrl || ''}
              alt="Preview"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  );
}