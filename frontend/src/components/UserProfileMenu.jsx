import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  User as UserIcon,
  ChevronDown,
  Camera,
  Trash2,
  Check,
  X,
  Upload,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Client-side Canvas Image Processor:
 * Crops image into a center square and compresses it to an optimal 320x320 avatar
 * Works with images of ANY size (even 10MB+ camera shots) without lagging or hitting quota limits.
 */
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 320; // Crisp high-DPI avatar resolution
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          // Center-crop square logic
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function UserProfileMenu() {
  const { user, logout, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Profile Form State
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [previewAvatar, setPreviewAvatar] = useState(user?.avatarUrl || null);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Loading & Feedback States
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [quickUploadSuccess, setQuickUploadSuccess] = useState(false);

  const menuRef = useRef(null);
  const modalFileInputRef = useRef(null);
  const directFileInputRef = useRef(null);

  // Synchronize state when modal opens or user updates
  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setPreviewAvatar(user.avatarUrl || null);
    }
  }, [user, isEditModalOpen]);

  // Click outside & Escape key listeners to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsEditModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle direct file upload from Dropdown Quick Action
  const handleDirectUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const processedDataUrl = await processImageFile(file);
      await updateProfile({
        name: user?.name,
        avatarUrl: processedDataUrl,
      });
      setQuickUploadSuccess(true);
      setTimeout(() => {
        setQuickUploadSuccess(false);
        setIsOpen(false);
      }, 700);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Unable to load image. Please select a valid image file (JPG, PNG, WebP).');
    } finally {
      setIsProcessingFile(false);
      if (directFileInputRef.current) {
        directFileInputRef.current.value = '';
      }
    }
  };

  // Handle file selection inside Modal
  const handleModalFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const processedDataUrl = await processImageFile(file);
      setPreviewAvatar(processedDataUrl);
      setShowUrlInput(false);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Unable to process this image. Please select a standard image file.');
    } finally {
      setIsProcessingFile(false);
      if (modalFileInputRef.current) {
        modalFileInputRef.current.value = '';
      }
    }
  };

  // Apply URL image
  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setPreviewAvatar(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  // Remove custom profile picture
  const handleRemoveAvatar = () => {
    setPreviewAvatar(null);
    setUrlInput('');
    if (modalFileInputRef.current) {
      modalFileInputRef.current.value = '';
    }
  };

  // Save changes from Modal
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name: nameInput.trim() || user?.email?.split('@')[0] || 'User',
        avatarUrl: previewAvatar || '',
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditModalOpen(false);
        setIsOpen(false);
      }, 600);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const initialLetter = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Hidden File Input for Direct Dropdown Quick Upload */}
      <input
        ref={directFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleDirectUpload}
        className="hidden"
      />

      {/* Account Name & Avatar Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-accent-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Account Settings & Profile"
      >
        {/* Avatar Circle */}
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-accent-50 border border-accent-200 text-accent-800 flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform relative">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initialLetter}</span>
          )}
        </div>

        {/* Text Info */}
        <div className="hidden md:block text-left">
          <p className="text-xs font-bold text-black leading-none group-hover:text-accent-800 transition-colors">
            {user?.name || 'User'}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate max-w-[130px]">
            {user?.email || 'authenticated'}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-black transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-black' : ''
          }`}
        />
      </button>

      {/* ====================================================================
       * DROPDOWN POPUP MENU
       * ==================================================================== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-zinc-200 shadow-xl z-50 p-2 origin-top-right"
          >
            {/* Header Summary */}
            <div className="p-3 bg-zinc-50 rounded-xl mb-1.5 flex items-center gap-3 border border-zinc-100">
              <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-accent-50 border border-accent-200 text-accent-800 flex items-center justify-center font-bold text-sm shadow-xs">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{initialLetter}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-black truncate leading-snug">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Action List */}
            <div className="space-y-0.5">
              {/* Quick Upload Own Image as PFP */}
              <button
                onClick={() => directFileInputRef.current?.click()}
                disabled={isProcessingFile}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-100 transition text-left cursor-pointer group"
              >
                {isProcessingFile ? (
                  <Loader2 className="w-4 h-4 text-accent-600 animate-spin" />
                ) : quickUploadSuccess ? (
                  <Check className="w-4 h-4 text-accent-600" />
                ) : (
                  <Upload className="w-4 h-4 text-zinc-400 group-hover:text-black" />
                )}
                <span>
                  {isProcessingFile
                    ? 'Processing Image...'
                    : quickUploadSuccess
                    ? 'Photo Updated!'
                    : 'Upload Own Image for PFP'}
                </span>
              </button>

              {/* Edit Full Profile (Name & PFP Modal) */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-100 transition text-left cursor-pointer group"
              >
                <UserIcon className="w-4 h-4 text-zinc-400 group-hover:text-black" />
                <span>Edit Profile & Name</span>
              </button>

              <div className="h-px bg-zinc-100 my-1" />

              {/* Logout Option */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Log Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================
       * EDIT PROFILE & PFP POPUP MODAL (PORTALED TO DOCUMENT.BODY)
       * ==================================================================== */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isEditModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                onClick={() => setIsEditModalOpen(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 relative my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="absolute top-5 right-5 p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Modal Title */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-black tracking-tight">Edit Profile</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Upload your own image to set your profile picture and customize your display name.
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    {/* Profile Picture (PFP) Upload Area */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                        Profile Picture
                      </label>

                      <div className="flex items-center gap-4">
                        {/* Avatar Preview with click-to-upload */}
                        <div
                          onClick={() => modalFileInputRef.current?.click()}
                          className="relative group cursor-pointer"
                          title="Click to choose an image from your computer"
                        >
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-accent-50 border-2 border-accent-200 text-accent-800 flex items-center justify-center font-bold text-2xl shadow-sm transition group-hover:border-accent-400">
                            {isProcessingFile ? (
                              <Loader2 className="w-7 h-7 text-accent-600 animate-spin" />
                            ) : previewAvatar ? (
                              <img
                                src={previewAvatar}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{initialLetter}</span>
                            )}
                          </div>

                          {/* Camera Hover Overlay */}
                          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        </div>

                        {/* Upload Controls */}
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => modalFileInputRef.current?.click()}
                              disabled={isProcessingFile}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-black bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5 text-zinc-700" />
                              {previewAvatar ? 'Change Photo' : 'Upload Image'}
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowUrlInput((prev) => !prev)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 border border-zinc-200 transition cursor-pointer"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                              Image URL
                            </button>

                            {previewAvatar && (
                              <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                                title="Remove custom photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </button>
                            )}
                          </div>

                          {/* URL input drawer */}
                          {showUrlInput && (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="url"
                                placeholder="Paste image link (https://...)"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                className="text-xs px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-black"
                              />
                              <button
                                type="button"
                                onClick={handleApplyUrl}
                                className="px-2.5 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                              >
                                Apply
                              </button>
                            </div>
                          )}

                          <p className="text-[11px] text-zinc-400">
                            Square or portrait photos work best. Automatically compressed.
                          </p>

                          <input
                            ref={modalFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleModalFileChange}
                            className="hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Name Input */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-2xl text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-500 transition font-medium"
                      />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || 'N/A'}
                        className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-2xl text-xs sm:text-sm text-zinc-500 cursor-not-allowed font-medium"
                      />
                    </div>

                    {/* Modal Footer Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving || isProcessingFile}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-zinc-400 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {saveSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Saved!
                          </>
                        ) : isSaving ? (
                          'Saving...'
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
