import React, { useState, useRef, useEffect } from 'react';
import {
  LogOut,
  User as UserIcon,
  ChevronDown,
  Camera,
  Trash2,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function UserProfileMenu() {
  const { user, logout, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Profile Form State
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [previewAvatar, setPreviewAvatar] = useState(user?.avatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync state when modal opens or user updates
  useEffect(() => {
    if (user) {
      setNameInput(user.name || '');
      setPreviewAvatar(user.avatarUrl || null);
    }
  }, [user, isEditModalOpen]);

  // Click outside listener to close dropdown
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

  // Handle local image file upload & convert to base64
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (under 3MB for localStorage safety)
    if (file.size > 3 * 1024 * 1024) {
      alert('Please select an image smaller than 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove custom profile picture
  const handleRemoveAvatar = () => {
    setPreviewAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save changes
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
    } finally {
      setIsSaving(false);
    }
  };

  const initialLetter = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Account Name & Avatar Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl hover:bg-zinc-100 border border-transparent hover:border-zinc-200 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-accent-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-accent-50 border border-accent-200 text-accent-800 flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
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
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-zinc-200 shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
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
              <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Session
              </span>
            </div>
          </div>

          {/* Action List */}
          <div className="space-y-0.5">
            {/* Edit Profile & PFP */}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsEditModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 hover:text-black hover:bg-zinc-100 transition text-left cursor-pointer"
            >
              <UserIcon className="w-4 h-4 text-zinc-400" />
              <span>Change Name & PFP</span>
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
        </div>
      )}

      {/* ====================================================================
       * EDIT PROFILE & PFP POPUP MODAL
       * ==================================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="bg-white border border-zinc-200 rounded-3xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Title */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-black tracking-tight">Edit Profile</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Customize your display name and profile picture
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Profile Picture (PFP) Upload */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-accent-50 border-2 border-accent-200 text-accent-800 flex items-center justify-center font-bold text-xl shadow-sm">
                      {previewAvatar ? (
                        <img
                          src={previewAvatar}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initialLetter}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-black bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-zinc-600" />
                        Upload Photo
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
                    <p className="text-[10px] text-zinc-400">
                      JPG, PNG, or GIF. Max 3MB recommended.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Display Name Input */}
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                />
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-500">
                  <span className="truncate">{user?.email}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Cognito Verified
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-accent-600 hover:bg-accent-700 shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
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
          </div>
        </div>
      )}
    </div>
  );
}
