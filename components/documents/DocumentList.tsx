'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Download, Eye, FileText, Info, Loader2, Printer, RefreshCw, Trash2, X, AlertTriangle,
} from 'lucide-react';

export interface DocumentRecord {
  id: string;
  documentId: string;
  documentNumber: string;
  templateName: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  downloadUrl: string;
  previewUrl: string;
  customerName?: string;
  errorMessage?: string;
  createdByName?: string;
  regeneratedFromId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  WOHNUNGSGEBERBESTAETIGUNG: 'Wohnungsgeberbestätigung',
};
const typeLabel = (t: string) => TYPE_LABELS[t] || t;

export const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-rose-100 text-rose-800',
  PROCESSING: 'bg-amber-100 text-amber-800',
};

interface Props {
  /** Bump to reload the list (e.g. after a new document was generated). */
  refreshKey?: number;
  /** Called with the job returned by "Regenerate" so the parent can show it. */
  onRegenerated?: (job: any) => void;
  onError?: (message: string) => void;
}

export default function DocumentList({ refreshKey = 0, onRegenerated, onError }: Props) {
  const { data: session } = useSession();
  const canDelete = ['SUPER_ADMIN', 'ADMIN'].includes(String(session?.user?.role));

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [preview, setPreview] = useState<DocumentRecord | null>(null);
  const [details, setDetails] = useState<DocumentRecord | null>(null);
  const [toDelete, setToDelete] = useState<DocumentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (status !== 'ALL') params.set('status', status);
      if (type !== 'ALL') params.set('type', type);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`/api/documents/history?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.history) {
        setDocuments(data.history);
        setListError('');
      } else {
        setListError(data.error || 'Failed to load documents.');
      }
    } catch {
      setListError('Could not reach the server to load documents.');
    } finally {
      setLoading(false);
    }
  }, [search, status, type, from, to]);

  // Debounced reload on filter change or when the parent signals a new document.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load, refreshKey]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/documents/${toDelete.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setDeleteError(data.error || 'Failed to delete the document.');
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== toDelete.id));
      if (preview?.id === toDelete.id) setPreview(null);
      if (details?.id === toDelete.id) setDetails(null);
      setToDelete(null);
    } catch {
      setDeleteError('Network error while deleting the document.');
    } finally {
      setDeleting(false);
    }
  };

  const regenerate = async (doc: DocumentRecord) => {
    if (regeneratingId) return;
    setRegeneratingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}/regenerate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) onError?.(data.error || 'Failed to regenerate the document.');
      else if (data.job) onRegenerated?.(data.job);
    } catch (e: any) {
      onError?.(e?.message || 'Network error occurred while regenerating the document.');
    } finally {
      setRegeneratingId(null);
      load();
    }
  };

  // Prints the stored PDF through a hidden same-origin iframe (works without opening the preview modal).
  const print = (doc: DocumentRecord) => {
    const frame = printFrameRef.current;
    if (!frame) return;
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        window.open(doc.previewUrl, '_blank');
      }
    };
    frame.src = `${doc.previewUrl}?t=${Date.now()}`;
  };

  const btn = 'px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50';
  const filtersActive = search || status !== 'ALL' || type !== 'ALL' || from || to;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-extrabold text-lg text-slate-900">Documents</h3>
          <p className="text-xs text-slate-500 font-mono">View, print, download, regenerate or delete generated documents.</p>
        </div>
        <button onClick={load} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search + filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 text-xs font-mono">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search number, name, client or creator..."
          className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-[#2E4036]"
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-none">
          <option value="ALL">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-none">
          <option value="ALL">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none" />
      </div>

      {listError && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl text-xs font-mono">{listError}</div>}

      {documents.length === 0 ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs border border-dashed border-slate-200 rounded-2xl">
          {filtersActive ? 'No documents match your filters.' : loading ? 'Loading documents...' : 'No documents generated yet.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <th className="py-3 px-4 font-bold">Document</th>
                <th className="py-3 px-4 font-bold">Type</th>
                <th className="py-3 px-4 font-bold">Generated</th>
                <th className="py-3 px-4 font-bold">Created by</th>
                <th className="py-3 px-4 font-bold">Size</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#2E4036]">{doc.fileName}</div>
                    <div className="text-[10px] text-slate-500">{doc.documentNumber}{doc.customerName ? ` · ${doc.customerName}` : ''}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{typeLabel(doc.documentType)}</td>
                  <td className="py-3.5 px-4 text-slate-500">{formatDateTime(doc.createdAt)}</td>
                  <td className="py-3.5 px-4 text-slate-600">{doc.createdByName || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-500">{doc.status === 'COMPLETED' ? formatBytes(doc.fileSize) : '—'}</td>
                  <td className="py-3.5 px-4">
                    <span title={doc.errorMessage || ''} className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_STYLES[doc.status] || ''}`}>
                      {doc.status}
                    </span>
                    {doc.status === 'FAILED' && doc.errorMessage && (
                      <div className="text-[10px] text-rose-600 mt-1 max-w-[220px] normal-case whitespace-normal">{doc.errorMessage}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {doc.status === 'COMPLETED' && (
                        <>
                          <button onClick={() => setPreview(doc)} className={btn} title="View PDF"><Eye className="w-3.5 h-3.5" /><span>View</span></button>
                          <a href={doc.downloadUrl} download={doc.fileName} className={btn} title="Download PDF"><Download className="w-3.5 h-3.5" /><span>Download</span></a>
                          <button onClick={() => print(doc)} className={btn} title="Print"><Printer className="w-3.5 h-3.5" /><span>Print</span></button>
                        </>
                      )}
                      <button onClick={() => regenerate(doc)} disabled={regeneratingId !== null} className={btn} title="Generate again from the original data">
                        <RefreshCw className={`w-3.5 h-3.5 ${regeneratingId === doc.id ? 'animate-spin' : ''}`} /><span>Regenerate</span>
                      </button>
                      <button onClick={() => setDetails(doc)} className={btn} title="Details"><Info className="w-3.5 h-3.5" /><span>Details</span></button>
                      {canDelete && (
                        <button
                          onClick={() => { setDeleteError(''); setToDelete(doc); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden frame used by Print */}
      <iframe ref={printFrameRef} title="print" className="hidden" />

      {/* PDF preview */}
      {preview && (
        <Overlay onClose={() => setPreview(null)} wide>
          <div className="bg-[#2E4036] text-white px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 text-[#CC5833] shrink-0" />
              <h3 className="font-bold text-sm font-mono tracking-tight truncate">{preview.fileName}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => print(preview)} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Printer className="w-3.5 h-3.5" /><span>Print</span>
              </button>
              <a href={preview.downloadUrl} download={preview.fileName} className="bg-[#CC5833] hover:bg-[#CC5833]/90 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /><span>Download</span>
              </a>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-xl hover:bg-white/10 cursor-pointer" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex-1 bg-slate-100 overflow-hidden">
            <iframe src={preview.previewUrl} className="w-full h-full border-none" title="PDF Document Preview" />
          </div>
        </Overlay>
      )}

      {/* Details */}
      {details && (
        <Overlay onClose={() => setDetails(null)}>
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <h3 className="font-heading font-extrabold text-base text-slate-900">Document details</h3>
            <button onClick={() => setDetails(null)} className="p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>
          <dl className="p-6 grid grid-cols-[130px_1fr] gap-y-2.5 text-xs font-mono overflow-y-auto">
            {([
              ['Document number', details.documentNumber],
              ['File name', details.fileName],
              ['Type', typeLabel(details.documentType)],
              ['Template', details.templateName],
              ['Client', details.customerName || '—'],
              ['Status', details.status],
              ['File size', details.status === 'COMPLETED' ? `${formatBytes(details.fileSize)} (${details.fileSize.toLocaleString('de-DE')} bytes)` : '—'],
              ['Format', details.mimeType],
              ['Created by', details.createdByName || '—'],
              ['Generated on', formatDateTime(details.completedAt || details.createdAt)],
              ['Last updated', formatDateTime(details.updatedAt)],
              ['Document ID', details.id],
              ...(details.regeneratedFromId ? [['Regenerated from', details.regeneratedFromId]] : []),
              ...(details.errorMessage ? [['Error', details.errorMessage]] : []),
            ] as string[][]).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-slate-400 uppercase tracking-wide text-[10px] pt-0.5">{k}</dt>
                <dd className="text-slate-800 break-all">{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </Overlay>
      )}

      {/* Delete confirmation */}
      {toDelete && (
        <Overlay onClose={() => !deleting && setToDelete(null)}>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5" /></div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900">Delete this document?</h3>
                <p className="text-xs text-slate-600 mt-1">
                  <span className="font-mono font-bold">{toDelete.documentNumber}</span> ({toDelete.fileName}) and its stored PDF will be permanently removed. This cannot be undone.
                </p>
              </div>
            </div>
            {deleteError && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs font-mono">{deleteError}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setToDelete(null)} disabled={deleting} className={btn}>Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}

function Overlay({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs font-body" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white border border-slate-200 rounded-3xl w-full shadow-2xl flex flex-col overflow-hidden max-h-[90vh] ${wide ? 'max-w-4xl h-[85vh]' : 'max-w-lg'}`} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
