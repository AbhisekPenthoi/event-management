import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './ImageUpload.css';

const ImageUpload = ({ onImageChange, existingUrl = '' }) => {
  const [imagePreview, setImagePreview] = useState(existingUrl);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setImagePreview(base64Image);
        onImageChange(base64Image);
        setIsUploading(false);
      };
      reader.onerror = () => {
        toast.error('Error reading file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    onImageChange('');
  };

  return (
    <div className="image-upload-container">
      <div className="upload-area">
        {imagePreview ? (
          <div className="image-preview">
            <img src={imagePreview} alt="Preview" />
            <button
              type="button"
              className="remove-btn"
              onClick={handleRemoveImage}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <label className="upload-label">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
            <div className="upload-box">
              {isUploading ? (
                <div className="uploading">
                  <div className="spinner"></div>
                  <p>Uploading...</p>
                </div>
              ) : (
                <>
                  <div className="upload-icon">📷</div>
                  <p className="upload-text">Click to upload or drag and drop</p>
                  <p className="upload-subtext">PNG, JPG, GIF up to 5MB</p>
                </>
              )}
            </div>
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;

