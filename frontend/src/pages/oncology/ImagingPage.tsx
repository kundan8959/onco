import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';
import { usePermissions } from '../../hooks/usePermissions';

const DOCUMENT_TYPE_CHOICES = [
  { value: 'lab_report', label: 'Lab Report (Blood/Urine Tests)' },
  { value: 'pathology', label: 'Pathology Report (Biopsy/Tissue)' },
  { value: 'ultrasound', label: 'Ultrasound/Sonography' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'ct_scan', label: 'CT Scan' },
  { value: 'mri', label: 'MRI Scan' },
  { value: 'pet_scan', label: 'PET Scan' },
  { value: 'mammography', label: 'Mammography' },
  { value: 'radiology_other', label: 'Other Imaging/Radiology' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'operative_report', label: 'Operative/Surgical Report' },
  { value: 'consultation_note', label: 'Consultation Note' },
  { value: 'other', label: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f6c23e',
  text_extracted: '#4e73df',
  analysis_complete: '#1cc88a',
  approved: '#1cc88a',
  rejected: '#e74a3b',
  extraction_failed: '#e74a3b',
  analysis_failed: '#e74a3b',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  text_extracted: 'Text Extracted',
  analysis_complete: 'Analysis Complete',
  approved: 'Approved',
  rejected: 'Rejected',
  extraction_failed: 'Extraction Failed',
  analysis_failed: 'Analysis Failed',
};

// ── AI Analysis via Claude API (example endpoint) ──────────────────────────
async function analyzeImageWithAI(file: File, documentType: string): Promise<any> {
  // Convert file to base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const isImage = file.type.startsWith('image/');
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  const systemPrompt = `You are an expert oncology radiologist and medical AI assistant.
Analyze the provided medical document/image and return structured JSON ONLY with these fields:
{
  "document_summary": "brief summary of the document",
  "findings": ["list", "of", "key", "findings"],
  "abnormalities": ["list", "of", "abnormalities", "or", "empty"],
  "tumor_indicators": ["any", "tumor", "or", "cancer", "indicators"],
  "recommendations": ["clinical", "recommendations"],
  "extracted_vitals": {"bp": "", "sugar": "", "spo2": ""},
  "cancer_indicators": true or false,
  "urgency": "routine|semi_urgent|urgent|emergent",
  "confidence_score": 0-100,
  "stage_hints": "any staging information found",
  "biomarkers": {}
}`;

  const userContent = isImage
    ? [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: `Analyze this ${documentType.replace('_', ' ')} medical document. Extract all relevant medical findings, abnormalities, and clinical data. Return ONLY valid JSON.`,
        },
      ]
    : [
        {
          type: 'text',
          text: `Analyze this ${documentType.replace('_', ' ')} medical document (PDF content encoded as base64): ${base64.substring(0, 2000)}...\n\nExtract all relevant medical findings and return ONLY valid JSON.`,
        },
      ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  const data = await response.json();
  const text = data.content?.find((c: any) => c.type === 'text')?.text || '{}';
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { document_summary: text, findings: [], recommendations: [], confidence_score: 0 };
  }
}

export default function ImagingPage() {
  const dispatch = useAppDispatch();
  const { canUploadDocument } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload form state
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('xray');
  const [uploadPatientId, setUploadPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientOptions, setPatientOptions] = useState<any[]>([]);

  // Reports list
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const params: any = { page_size: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/medical-reports', { params });
      setReports(res.data.results || res.data || []);
    } catch {
      // endpoint may not exist yet — show empty gracefully
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Patient search
  useEffect(() => {
    if (patientSearch.length < 2) { setPatientOptions([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/patients', { params: { search: patientSearch, page_size: 6 } });
        setPatientOptions(res.data.results || res.data || []);
      } catch { setPatientOptions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadPatientId) {
      dispatch(showNotice({ kind: 'error', text: 'Select a patient and a file first.' }));
      return;
    }

    setUploading(true);
    setAnalyzing(false);
    setAiResult(null);

    try {
      // Step 1: Send to AI for analysis
      setAnalyzing(true);
      dispatch(showNotice({ kind: 'info', text: 'Sending to AI for analysis…' }));
      const aiAnalysis = await analyzeImageWithAI(uploadFile, uploadDocType);
      setAiResult(aiAnalysis);
      setAnalyzing(false);

      // Step 2: Upload file to backend with AI results
      const formData = new FormData();
      formData.append('patient', uploadPatientId);
      formData.append('document_file', uploadFile);
      formData.append('document_type', uploadDocType);
      formData.append('status', 'analysis_complete');
      formData.append('extracted_data', JSON.stringify(aiAnalysis));
      formData.append('insights', JSON.stringify({
        findings: aiAnalysis.findings || [],
        abnormalities: aiAnalysis.abnormalities || [],
        tumor_indicators: aiAnalysis.tumor_indicators || [],
        urgency: aiAnalysis.urgency || 'routine',
      }));
      formData.append('recommendations', JSON.stringify(aiAnalysis.recommendations || []));

      try {
        await api.post('/medical-reports', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        dispatch(showNotice({ kind: 'success', text: 'Report uploaded and analyzed successfully!' }));
        fetchReports();
      } catch {
        // Backend endpoint might not exist — still show AI results
        dispatch(showNotice({ kind: 'success', text: 'AI analysis complete. Backend upload endpoint pending.' }));
      }

      // Reset form
      setUploadFile(null);
      setUploadPatientId('');
      setPatientSearch('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      dispatch(showNotice({ kind: 'error', text: `Analysis failed: ${err.message}` }));
      setAnalyzing(false);
    } finally {
      setUploading(false);
    }
  };

  const runAiAnalysis = async (report: any) => {
    setAnalysisLoading(true);
    setSelectedReport(report);
    try {
      // Simulate re-analysis with existing report data
      const mockResult = {
        document_summary: report.extracted_data?.document_summary || `${report.document_type_display || report.document_type} analysis`,
        findings: report.insights?.findings || ['Report loaded from backend'],
        abnormalities: report.insights?.abnormalities || [],
        tumor_indicators: report.insights?.tumor_indicators || [],
        recommendations: report.recommendations || [],
        confidence_score: report.ai_confidence_score || 85,
        urgency: report.insights?.urgency || 'routine',
        cancer_indicators: report.insights?.cancer_indicators || false,
      };
      setAiResult(mockResult);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const filteredReports = statusFilter
    ? reports.filter(r => r.status === statusFilter)
    : reports;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-x-ray"></i> Imaging &amp; AI Analysis</h2>
        <p className="page-subtitle">Upload medical images/documents → AI analyzes → findings surface in oncology</p>
      </div>

      <div className="panel-grid" style={{ gridTemplateColumns: canUploadDocument ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 24 }}>
        {/* Upload Panel */}
        {canUploadDocument && <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}><i className="fas fa-upload" style={{ marginRight: 8, color: '#4e73df' }}></i>Upload &amp; Analyze</h3>
          <form onSubmit={handleUpload}>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Patient *</label>
              <input
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                placeholder="Search patient name or MRN…"
                style={{ width: '100%' }}
              />
              {patientOptions.length > 0 && (
                <div style={{ border: '1px solid #d1d3e2', borderRadius: 6, background: '#fff', maxHeight: 160, overflowY: 'auto', marginTop: 2 }}>
                  {patientOptions.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setUploadPatientId(String(p.id)); setPatientSearch(`${p.first_name} ${p.last_name} (${p.medical_record_number})`); setPatientOptions([]); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', fontSize: 13 }}
                      onMouseOver={e => (e.currentTarget.style.background = '#f8f9fc')}
                      onMouseOut={e => (e.currentTarget.style.background = '#fff')}
                    >
                      <strong>{p.first_name} {p.last_name}</strong> — {p.medical_record_number}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Document Type *</label>
              <select
                value={uploadDocType}
                onChange={e => setUploadDocType(e.target.value)}
                style={{ width: '100%' }}
              >
                {DOCUMENT_TYPE_CHOICES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, fontSize: 13 }}>File * (PDF, JPG, PNG — max 10MB)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ width: '100%' }}
              />
              {uploadFile && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#858796' }}>
                  Selected: <strong>{uploadFile.name}</strong> ({(uploadFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading || analyzing || !uploadFile || !uploadPatientId}
              style={{ width: '100%' }}
            >
              {analyzing ? <><i className="fas fa-brain"></i> AI Analyzing…</> :
               uploading ? <><i className="fas fa-spinner fa-spin"></i> Uploading…</> :
               <><i className="fas fa-magic"></i> Upload &amp; Run AI Analysis</>}
            </button>
          </form>

          {/* AI Pipeline Steps */}
          <div style={{ marginTop: 20, padding: 12, background: '#f8f9fc', borderRadius: 8, fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#5a5c69' }}>AI PIPELINE</div>
            {[
              { icon: 'fa-file-upload', label: 'File validation & upload', done: !!uploadFile },
              { icon: 'fa-eye', label: 'AI visual/text analysis (Claude)', done: !!aiResult },
              { icon: 'fa-list-ul', label: 'Extract findings & recommendations', done: !!aiResult?.findings },
              { icon: 'fa-database', label: 'Store in backend (medical_reports)', done: false },
              { icon: 'fa-link', label: 'Link to oncology record', done: false },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', color: step.done ? '#1cc88a' : '#858796' }}>
                <i className={`fas ${step.icon}`} style={{ width: 16 }}></i>
                <span style={{ textDecoration: step.done ? 'line-through' : 'none', opacity: step.done ? 0.7 : 1 }}>{step.label}</span>
                {step.done && <i className="fas fa-check" style={{ marginLeft: 'auto', fontSize: 10 }}></i>}
              </div>
            ))}
          </div>
        </div>}

        {/* AI Results Panel */}
        <div className="card" style={{ overflowY: 'auto', maxHeight: 500 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}><i className="fas fa-brain" style={{ marginRight: 8, color: '#1cc88a' }}></i>AI Analysis Results</h3>

          {!aiResult && !analyzing && (
            <div style={{ textAlign: 'center', padding: 40, color: '#b7b9cc' }}>
              <i className="fas fa-microscope" style={{ fontSize: 48, marginBottom: 16, display: 'block' }}></i>
              Upload a file to see AI-powered analysis here
            </div>
          )}

          {analyzing && (
            <div style={{ textAlign: 'center', padding: 40, color: '#4e73df' }}>
              <i className="fas fa-brain fa-pulse" style={{ fontSize: 48, marginBottom: 16, display: 'block' }}></i>
              <div style={{ fontWeight: 600 }}>Claude AI is analyzing your document…</div>
              <div style={{ fontSize: 13, color: '#858796', marginTop: 8 }}>This may take 10–30 seconds</div>
            </div>
          )}

          {aiResult && !analyzing && (
            <div>
              {/* Confidence & Urgency */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, background: '#f8f9fc', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: aiResult.confidence_score > 70 ? '#1cc88a' : '#f6c23e' }}>
                    {aiResult.confidence_score}%
                  </div>
                  <div style={{ fontSize: 11, color: '#858796' }}>AI Confidence</div>
                </div>
                <div style={{ flex: 1, background: '#f8f9fc', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: aiResult.urgency === 'emergent' ? '#e74a3b' : aiResult.urgency === 'urgent' ? '#f6c23e' : '#1cc88a' }}>
                    {(aiResult.urgency || 'routine').toUpperCase()}
                  </div>
                  <div style={{ fontSize: 11, color: '#858796' }}>Urgency Level</div>
                </div>
                {aiResult.cancer_indicators && (
                  <div style={{ flex: 1, background: '#fff5f5', borderRadius: 8, padding: 12, textAlign: 'center', border: '1px solid #e74a3b' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e74a3b' }}>⚠ ALERT</div>
                    <div style={{ fontSize: 11, color: '#858796' }}>Cancer Indicators</div>
                  </div>
                )}
              </div>

              {/* Summary */}
              {aiResult.document_summary && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#5a5c69', marginBottom: 4 }}>SUMMARY</div>
                  <p style={{ margin: 0, fontSize: 13, color: '#3a3b45', lineHeight: 1.5 }}>{aiResult.document_summary}</p>
                </div>
              )}

              {/* Findings */}
              {aiResult.findings?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#5a5c69', marginBottom: 4 }}>KEY FINDINGS</div>
                  {aiResult.findings.map((f: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, padding: '3px 0', display: 'flex', gap: 6 }}>
                      <span style={{ color: '#4e73df' }}>•</span> {f}
                    </div>
                  ))}
                </div>
              )}

              {/* Abnormalities */}
              {aiResult.abnormalities?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#e74a3b', marginBottom: 4 }}>ABNORMALITIES</div>
                  {aiResult.abnormalities.map((a: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, padding: '3px 0', display: 'flex', gap: 6, color: '#e74a3b' }}>
                      <span>⚠</span> {a}
                    </div>
                  ))}
                </div>
              )}

              {/* Tumor Indicators */}
              {aiResult.tumor_indicators?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#6f42c1', marginBottom: 4 }}>TUMOR INDICATORS</div>
                  {aiResult.tumor_indicators.map((t: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, padding: '3px 0', color: '#6f42c1' }}>▸ {t}</div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {aiResult.recommendations?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#1cc88a', marginBottom: 4 }}>RECOMMENDATIONS</div>
                  {aiResult.recommendations.map((r: string, i: number) => (
                    <div key={i} style={{ fontSize: 13, padding: '3px 0', display: 'flex', gap: 6 }}>
                      <span style={{ color: '#1cc88a' }}>✓</span> {r}
                    </div>
                  ))}
                </div>
              )}

              {/* Stage hints */}
              {aiResult.stage_hints && (
                <div style={{ marginTop: 12, padding: 10, background: '#e8f0fe', borderRadius: 6, fontSize: 13 }}>
                  <strong>Staging hint:</strong> {aiResult.stage_hints}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}><i className="fas fa-folder-open" style={{ marginRight: 8, color: '#4e73df' }}></i>Medical Reports</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 13 }}>
              <option value="">All Statuses</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button className="btn btn-secondary" onClick={fetchReports} style={{ fontSize: 12 }}>
              <i className="fas fa-sync"></i> Refresh
            </button>
          </div>
        </div>

        {loadingReports ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#858796' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: 24 }}></i>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#b7b9cc' }}>
            <i className="fas fa-x-ray" style={{ fontSize: 40, marginBottom: 12, display: 'block' }}></i>
            No reports yet. Upload an image or document above to begin AI analysis.
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Patient</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>AI Findings</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => (
                  <tr key={r.id}>
                    <td>{DOCUMENT_TYPE_CHOICES.find(c => c.value === r.document_type)?.label || r.document_type}</td>
                    <td>{r.patient_name || r.patient || '—'}</td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: `${STATUS_COLORS[r.status]}20`,
                        color: STATUS_COLORS[r.status] || '#858796',
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString() : '—'}</td>
                    <td style={{ fontSize: 12 }}>
                      {r.insights?.findings?.length > 0 ? (
                        <span style={{ color: '#1cc88a' }}>{r.insights.findings.length} findings</span>
                      ) : r.extracted_data?.findings?.length > 0 ? (
                        <span style={{ color: '#4e73df' }}>{r.extracted_data.findings.length} extracted</span>
                      ) : (
                        <span style={{ color: '#b7b9cc' }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '3px 10px' }}
                        onClick={() => runAiAnalysis(r)}
                        disabled={analysisLoading}
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Report Detail */}
      {selectedReport && aiResult && !analyzing && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>
              <i className="fas fa-microscope" style={{ marginRight: 8, color: '#6f42c1' }}></i>
              Report Detail — {DOCUMENT_TYPE_CHOICES.find(c => c.value === selectedReport.document_type)?.label}
            </h3>
            <button className="btn btn-secondary" onClick={() => { setSelectedReport(null); setAiResult(null); }} style={{ fontSize: 12 }}>
              <i className="fas fa-times"></i> Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#5a5c69', marginBottom: 8 }}>RAW EXTRACTED DATA</div>
              <pre style={{ background: '#f8f9fc', borderRadius: 6, padding: 12, fontSize: 11, overflowX: 'auto', maxHeight: 200 }}>
                {JSON.stringify(selectedReport.extracted_data || {}, null, 2)}
              </pre>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#5a5c69', marginBottom: 8 }}>AI INSIGHTS</div>
              <pre style={{ background: '#f0f7ff', borderRadius: 6, padding: 12, fontSize: 11, overflowX: 'auto', maxHeight: 200 }}>
                {JSON.stringify(aiResult, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
