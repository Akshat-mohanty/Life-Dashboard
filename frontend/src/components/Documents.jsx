/**
 * Documents Component
 * Manages secure document storage with S3 presigned uploads, category pills,
 * 30-day expiry early warning badges, and direct view/download links.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      ID: 'bg-accent-500/15 text-accent-300 border-accent-500/30',
      insurance: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      certificate: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      medical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      other: 'bg-white/[0.06] text-slate-300 border-white/10',
    };
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styleMap[category] || styleMap.other}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="bg-[#0E1017]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col h-full relative overflow-hidden group/card hover:border-white/15 transition-all">
      {/* Subtle top glow */}
      <div className="absolute top-0 right-1/4 w-40 h-20 bg-accent-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 flex items-center justify-center shadow-glow-sm">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base tracking-tight">Documents</h3>
            <p className="text-xs text-slate-400">S3 Vault & Expiry Warnings</p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 shadow-glow-sm border border-accent-400/30 transition-all hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        )}
      </div>

      {/* Summary Chips */}
      <div className="mt-4 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-between relative z-10">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Vault Documents</span>
          <span className="text-2xl font-extrabold text-white tracking-tight">{summary.totalCount}</span>
        </div>
        <div className="text-right">
          {summary.expiringSoonCount > 0 && (
            <span className="text-xs font-semibold text-amber-400 block flex items-center gap-1 justify-end">
              <AlertTriangle className="w-3 h-3 text-amber-400" /> {summary.expiringSoonCount} Expiring Soon
            </span>
          )}
          {summary.expiredCount > 0 && (
            <span className="text-[11px] font-semibold text-rose-400 block flex items-center gap-0.5 justify-end mt-0.5">
              <ShieldAlert className="w-3 h-3 text-rose-400" /> {summary.expiredCount} Expired
            </span>
          )}
        </div>
      </div>

      {/* Inline Upload Form */}
      {isAdding && (
        <form onSubmit={handleUploadSubmit} className="mt-4 p-4 bg-white/[0.03] rounded-xl border border-white/10 space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Upload to S3 Vault</span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File Picker */}
          <div>
            <label className="border-2 border-dashed border-white/15 hover:border-accent-400/60 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition group">
              <UploadCloud className="w-6 h-6 text-accent-400 group-hover:scale-110 mb-1 transition-transform" />
              <span className="text-xs font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Choose PDF, image or certificate'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Max 15MB • Direct presigned S3 upload</span>
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
            <input
              type="text"
              placeholder="Document Name (e.g. Health Insurance Policy)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-[#141722] border border-white/10 text-white rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
              >
                <option value="ID">ID Card / Passport</option>
                <option value="insurance">Insurance</option>
                <option value="certificate">Certificate / Vehicle</option>
                <option value="medical">Medical Record</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <input
                type="date"
                title="Expiry Date (optional)"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white/[0.04] border border-white/10 text-white rounded-lg focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || !selectedFile}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-accent-600 hover:bg-accent-500 shadow-glow-sm transition disabled:opacity-60"
            >
              {uploadProgress ? 'Uploading to S3...' : 'Upload File'}
            </button>
          </div>
        </form>
      )}

      {/* Document List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5 relative z-10">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/[0.03] border border-white/[0.06] rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-400 p-2">Error loading documents: {error.message}</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-medium text-slate-300">No documents uploaded.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Store IDs, insurances & warranty cards.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-3.5 rounded-xl border transition-all ${
                doc.isExpired
                  ? 'bg-rose-500/[0.04] border-rose-500/30'
                  : doc.expiresSoon
                  ? 'bg-amber-500/[0.04] border-amber-500/30'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-white/15 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white truncate">{doc.name}</h4>
                    {getCategoryBadge(doc.category)}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 flex-wrap">
                    {doc.expiryDate ? (
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          doc.isExpired
                            ? 'text-rose-400'
                            : doc.expiresSoon
                            ? 'text-amber-400'
                            : 'text-slate-400'
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
                      <span className="text-slate-500">No expiration</span>
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
                      className="p-1.5 text-accent-400 hover:text-accent-300 hover:bg-accent-500/10 rounded-lg transition"
                      title="View / Download Document"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
