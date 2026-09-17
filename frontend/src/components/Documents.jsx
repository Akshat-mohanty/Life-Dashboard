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
      ID: 'bg-purple-100 text-purple-800 border-purple-200',
      insurance: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      certificate: 'bg-amber-100 text-amber-800 border-amber-200',
      medical: 'bg-rose-100 text-rose-800 border-rose-200',
      other: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styleMap[category] || styleMap.other}`}>
        {category}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Documents</h3>
            <p className="text-xs text-slate-500">S3 Vault & Expiry Warnings</p>
          </div>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        )}
      </div>

      {/* Summary Chips */}
      <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Vault Documents</span>
          <span className="text-xl font-extrabold text-slate-900">{summary.totalCount}</span>
        </div>
        <div className="text-right">
          {summary.expiringSoonCount > 0 && (
            <span className="text-xs font-semibold text-amber-700 block flex items-center gap-1 justify-end">
              <AlertTriangle className="w-3 h-3 text-amber-600" /> {summary.expiringSoonCount} Expiring Soon
            </span>
          )}
          {summary.expiredCount > 0 && (
            <span className="text-[11px] font-semibold text-rose-600 block flex items-center gap-0.5 justify-end mt-0.5">
              <ShieldAlert className="w-3 h-3 text-rose-600" /> {summary.expiredCount} Expired
            </span>
          )}
        </div>
      </div>

      {/* Inline Upload Form */}
      {isAdding && (
        <form onSubmit={handleUploadSubmit} className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Upload to S3 Vault</span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File Picker */}
          <div>
            <label className="border-2 border-dashed border-slate-300 hover:border-purple-400 bg-white rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition">
              <UploadCloud className="w-6 h-6 text-purple-500 mb-1" />
              <span className="text-xs font-semibold text-slate-700">
                {selectedFile ? selectedFile.name : 'Choose PDF, image or certificate'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">Max 15MB • Uploads directly to private S3</span>
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
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || !selectedFile}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition disabled:opacity-60"
            >
              {uploadProgress ? 'Uploading to S3...' : 'Upload File'}
            </button>
          </div>
        </form>
      )}

      {/* Document List */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-0.5">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-xs text-rose-600 p-2">Error loading documents: {error.message}</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No documents uploaded.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Store IDs, insurances & warranty cards.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-3.5 rounded-xl border transition-all ${
                doc.isExpired
                  ? 'bg-rose-50/40 border-rose-200'
                  : doc.expiresSoon
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name}</h4>
                    {getCategoryBadge(doc.category)}
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                    {doc.expiryDate ? (
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          doc.isExpired
                            ? 'text-rose-600'
                            : doc.expiresSoon
                            ? 'text-amber-700'
                            : 'text-slate-600'
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
                      <span className="text-slate-400">No expiration</span>
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
                      className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition"
                      title="View / Download Document"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
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
