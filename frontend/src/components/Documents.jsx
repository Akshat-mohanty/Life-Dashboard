/**
 * Documents Component
 * Manages secure document storage with S3 presigned uploads, category pills,
 * 30-day expiry early warning badges, and direct view/download links.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  Trash2,
  X,
  Calendar,
  AlertTriangle,
  Download,
  ExternalLink,
  UploadCloud,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { documentsApi } from '../api/client';

export default function Documents() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'ID',
    expiryDate: '',
  });

  // Query documents
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const res = await documentsApi.list();
      return res;
    },
  });

  const documents = data?.items || [];
  const summary = data?.summary || {
    totalCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
  };

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, metadata }) => {
      setUploadProgress(true);
      const res = await documentsApi.upload(file, metadata);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      resetForm();
    },
    onSettled: () => {
      setUploadProgress(false);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'ID',
      expiryDate: '',
    });
    setSelectedFile(null);
    setIsAdding(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.name) {
        // Auto fill document name without file extension
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setFormData((prev) => ({ ...prev, name: cleanName }));
      }
    }
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !selectedFile) return;

    uploadMutation.mutate({
      file: selectedFile,
      metadata: {
        name: formData.name.trim(),
        category: formData.category,
        expiryDate: formData.expiryDate ? formData.expiryDate : null,
      },
    });
  };

  // Category pill style
  const getCategoryBadge = (category) => {
    const styleMap = {
      ID: 'bg-accent-50 text-accent-800 border-accent-200',
      insurance: 'bg-accent-50 text-accent-800 border-accent-200',
      certificate: 'bg-amber-50 text-amber-800 border-amber-200',
      medical: 'bg-rose-50 text-rose-800 border-rose-200',
      other: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    };
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styleMap[category] || styleMap.other}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="bg-white/95 border border-zinc-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all flex flex-col h-full">
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <FileText className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-900 text-sm tracking-tight whitespace-nowrap">Documents</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 whitespace-nowrap">
                {summary.totalCount} files
              </span>
              {summary.expiringSoonCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                  {summary.expiringSoonCount} expiring
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 whitespace-nowrap">Encrypted Cloud Vault & Expiry Warnings</p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-2xs hover:border-zinc-300 transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-700" />
            <span>Upload</span>
          </button>
        )}
      </div>

      {/* Upload Document Modal Popup */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={resetForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 14 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="bg-white rounded-3xl border border-zinc-200 shadow-2xl p-6 max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-4">
                <div>
                  <h3 className="text-base font-bold text-black tracking-tight">Upload Document</h3>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1.5 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {/* File Picker */}
                <div>
                  <label className="border-2 border-dashed border-zinc-200 hover:border-accent-400 bg-zinc-50 hover:bg-accent-50/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition group">
                    <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-zinc-200 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-5 h-5 text-accent-700" />
                    </div>
                    <span className="text-xs font-bold text-black text-center truncate max-w-[280px]">
                      {selectedFile ? selectedFile.name : 'Click to select PDF or image'}
                    </span>
                    <span className="text-[10px] text-zinc-500 mt-1">PDF, PNG, JPG up to 15MB</span>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      required
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                    Document Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Health Insurance Policy, Vehicle RC, Passport"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition cursor-pointer"
                    >
                      <option value="ID">ID Card / Passport</option>
                      <option value="insurance">Insurance</option>
                      <option value="certificate">Certificate / Vehicle</option>
                      <option value="medical">Medical Record</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-black focus:outline-none focus:bg-white focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-black hover:bg-zinc-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadMutation.isPending || !selectedFile}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-zinc-50 border border-zinc-300 hover:border-zinc-400 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {uploadProgress ? 'Uploading to S3...' : 'Upload File'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-zinc-100 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-600 p-2">Error loading documents: {error.message}</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-6 px-4 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
            <FileCheck className="w-5 h-5 mx-auto mb-1.5 text-zinc-300" />
            <p className="text-xs font-semibold text-zinc-700">Vault is empty</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Securely upload IDs, insurance, and medical documents</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`p-3.5 rounded-xl border transition-all ${
                  doc.isExpired
                    ? 'bg-rose-50/50 border-rose-200'
                    : doc.expiresSoon
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-black truncate">{doc.name}</h4>
                      {getCategoryBadge(doc.category)}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500 flex-wrap">
                      {doc.expiryDate ? (
                        <span
                          className={`flex items-center gap-1 font-semibold ${
                            doc.isExpired
                              ? 'text-rose-700'
                              : doc.expiresSoon
                              ? 'text-amber-800'
                              : 'text-zinc-600'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {doc.isExpired ? (
                            `Expired (${doc.expiryDate})`
                          ) : doc.expiresSoon ? (
                            `Expires in ${doc.daysUntilExpiry} days (${doc.expiryDate})`
                          ) : (
                            `Expires ${doc.expiryDate}`
                          )}
                        </span>
                      ) : (
                        <span className="text-zinc-400">No expiration</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-accent-700 hover:text-accent-800 hover:bg-accent-50 rounded-lg transition"
                        title="View / Download Document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => deleteMutation.mutate(doc.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
