import { useCallback, useEffect, useRef, useState } from 'react';
import { imagingApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Processing',
  text_extracted: 'Text Extracted',
  analysis_complete: 'AI Analysis Ready',
  approved: 'Approved',
  rejected: 'Rejected',
  extraction_failed: 'Processing Failed',
  analysis_failed: 'Analysis Failed',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#6b7280',
  text_extracted: '#3b82f6',
  analysis_complete: '#10b981',
  approved: '#10b981',
  rejected: '#ef4444',
  extraction_failed: '#ef4444',
  analysis_failed: '#ef4444',
};

export default function PatientDocumentsPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('lab_report');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await imagingApi.list({ page_size: 50 });
      setItems(res.data.results || res.data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('document_type', docType);
      fd.append('document_file', uploadFile);
      await imagingApi.upload(fd);
      dispatch(showNotice({ kind: 'success', text: 'Document uploaded. Your care team will review it.' }));
      setUploadOpen(false);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDocs();
    } catch (err: any) {
      dispatch(showNotice({ kind: 'error', text: err.response?.data?.detail || 'Upload failed.' }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="patient-hero-card">
        <div>
          <span className="eyebrow">My Care</span>
          <h1>My Documents</h1>
          <p>Reports, lab results, and imaging uploaded by your care team — with AI analysis summaries.</p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => setUploadOpen(true)}>Upload Document</button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center' }}>Loading your documents…</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <i className="fas fa-file-medical" style={{ fontSize: 40, color: '#d1d5db', marginBottom: 12 }}></i>
          <p style={{ color: '#6b7280' }}>No documents yet. Your care team will upload reports here after visits.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', cursor: 'pointer' }}
              onClick={() => setSelected(selected?.id === item.id ? null : item)}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.document_type_display || item.document_type}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : '—'}
                  {item.page_count ? ` · ${item.page_count} page(s)` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge" style={{ background: STATUS_COLORS[item.status] || '#6b7280', color: '#fff' }}>
                  {STATUS_LABELS[item.status] || item.status}
                </span>
                <i className={`fas fa-chevron-${selected?.id === item.id ? 'up' : 'down'}`} style={{ color: '#9ca3af' }}></i>
              </div>
            </div>
          ))}
          {selected && (
            <div className="card" style={{ padding: '20px 24px' }}>
              <h4 style={{ marginBottom: 12 }}>AI Analysis Results</h4>
              {selected.status === 'pending' || selected.status === 'text_extracted' ? (
                <p style={{ color: '#6b7280' }}>Your document is being processed by our AI system. Check back soon.</p>
              ) : selected.status === 'approved' && (selected.insights || selected.recommendations) ? (
                <>
                  {selected.insights && Object.keys(selected.insights).length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <strong style={{ display: 'block', marginBottom: 6 }}>Clinical Insights</strong>
                      {Array.isArray(selected.insights)
                        ? <ul style={{ paddingLeft: 20 }}>{selected.insights.map((ins: string, i: number) => <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>{ins}</li>)}</ul>
                        : <pre style={{ background: '#f4f7fa', padding: 12, borderRadius: 6, fontSize: 12, whiteSpace: 'pre-wrap' }}>{JSON.stringify(selected.insights, null, 2)}</pre>
                      }
                    </div>
                  )}
                  {selected.recommendations && Object.keys(selected.recommendations).length > 0 && (
                    <div>
                      <strong style={{ display: 'block', marginBottom: 6 }}>Recommendations</strong>
                      {Array.isArray(selected.recommendations)
                        ? <ul style={{ paddingLeft: 20 }}>{selected.recommendations.map((r: string, i: number) => <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>{r}</li>)}</ul>
                        : <pre style={{ background: '#f0faf4', padding: 12, borderRadius: 6, fontSize: 12, whiteSpace: 'pre-wrap' }}>{JSON.stringify(selected.recommendations, null, 2)}</pre>
                      }
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#6b7280' }}>No AI analysis available for this document yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {uploadOpen && (
        <div className="modal-overlay" onClick={() => setUploadOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload a Document</h3>
              <button className="modal-close" onClick={() => setUploadOpen(false)}>×</button>
            </div>
            <form onSubmit={handleUpload} className="form-grid">
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Document Type *</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} required>
                  <option value="lab_report">Lab Report</option>
                  <option value="xray">X-Ray</option>
                  <option value="ct_scan">CT Scan</option>
                  <option value="mri">MRI Scan</option>
                  <option value="prescription">Prescription</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>File * (PDF, JPG, PNG — max 10 MB)</label>
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} required />
              </div>
              <div className="form-actions" style={{ gridColumn: '1/-1' }}>
                <button className="btn btn-primary" type="submit" disabled={uploading || !uploadFile}>
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setUploadOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
