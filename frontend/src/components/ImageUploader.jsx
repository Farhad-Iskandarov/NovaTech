import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * ImageUploader Component
 * Allows users to add images via URL or file upload
 * 
 * Props:
 * - value: current image URL (string)
 * - onChange: callback when image changes (function)
 * - label: label text (string, optional)
 * - placeholder: URL input placeholder (string, optional)
 * - required: whether field is required (boolean, optional)
 * - testId: data-testid prefix (string, optional)
 */
export function ImageUploader({
  value = '',
  onChange,
  label = 'Image',
  placeholder = 'https://example.com/image.jpg',
  required = false,
  testId = 'image-uploader'
}) {
  const [mode, setMode] = useState('url'); // 'url' or 'upload'
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem('novatech-token');

  const handleUrlChange = (e) => {
    setError('');
    setUploadedFile(null);
    onChange(e.target.value);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG, PNG, and WebP are allowed.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload/image`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
        setUploadedFile({
          name: file.name,
          url: imageUrl
        });
        onChange(imageUrl);
        setError('');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedFile(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentImage = value;

  return (
    <div className="space-y-3" data-testid={testId}>
      {/* Label */}
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={mode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('url')}
          className={`flex items-center gap-1 ${mode === 'url' ? 'bg-[#5B5BF7] hover:bg-[#4A4AE0]' : ''}`}
          data-testid={`${testId}-mode-url`}
        >
          <LinkIcon className="w-3 h-3" />
          URL
        </Button>
        <Button
          type="button"
          variant={mode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('upload')}
          className={`flex items-center gap-1 ${mode === 'upload' ? 'bg-[#5B5BF7] hover:bg-[#4A4AE0]' : ''}`}
          data-testid={`${testId}-mode-upload`}
        >
          <Upload className="w-3 h-3" />
          Upload
        </Button>
      </div>

      {/* URL Input Mode */}
      {mode === 'url' && (
        <Input
          type="url"
          value={uploadedFile ? '' : value}
          onChange={handleUrlChange}
          placeholder={placeholder}
          disabled={!!uploadedFile}
          data-testid={`${testId}-url-input`}
        />
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
              data-testid={`${testId}-file-input`}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2"
              data-testid={`${testId}-upload-btn`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Choose File
                </>
              )}
            </Button>
            <span className="text-xs text-slate-500">
              JPG, PNG, WebP (max 5MB)
            </span>
          </div>

          {uploadedFile && (
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <ImageIcon className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-400 truncate flex-1">
                {uploadedFile.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveImage}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                data-testid={`${testId}-remove-btn`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500" data-testid={`${testId}-error`}>
          {error}
        </p>
      )}

      {/* Image Preview */}
      {currentImage && (
        <div className="relative mt-2">
          <div className="w-full h-40 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <img
              src={currentImage}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              data-testid={`${testId}-preview`}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 h-8 w-8 p-0"
            data-testid={`${testId}-clear-btn`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
