import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { oncologyApi, patientsApi } from '../../api';
import PatientSearchPicker from '../../components/PatientSearchPicker';

const CANCER_TYPES = [
  'Breast Cancer',
  'Prostate Cancer',
  'Lung Cancer',
  'Colorectal Cancer',
];

const emptyForm = {
  patient_id: '',
  cancer_type: 'Breast Cancer',
  icd10_code: '',
  diagnosis_date: '',
  diagnosis_confirmed: true,
  confirmed_by: 'pathology',
  ai_confidence_score: '95',
  pathology_report_notes: '',
  t_stage: '',
  n_stage: '',
  m_stage: '',
  clinical_stage: '',
  histology_type: '',
  grade: '',
  biomarkers: '{}',
  ecog_performance_status: '',
  supporting_lab_results: '',
  imaging_findings: '',
  clinical_notes: '',
  treatment_intent: '',
  urgency_level: 'routine',
  recommended_surgery: '',
  recommended_chemotherapy: '',
  recommended_radiation: '',
  recommended_immunotherapy: '',
  recommended_targeted_therapy: '',
  notes: '',
  status: 'active',
};

export default function RecordFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    oncologyApi.records.get(Number(id)).then(async (res) => {
      setForm({
        ...emptyForm,
        ...res.data,
        ai_confidence_score: res.data.ai_confidence_score ?? '95',
        biomarkers: JSON.stringify(res.data.biomarkers || {}, null, 2),
        ecog_performance_status: res.data.ecog_performance_status ?? '',
      });
      if (res.data.patient) setSelectedPatient(res.data.patient);
      else if (res.data.patient_id) setSelectedPatient((await patientsApi.get(res.data.patient_id)).data);
    });
  }, [id, isEdit]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        patient_id: Number(form.patient_id),
        diagnosis_confirmed: !!form.diagnosis_confirmed,
        ai_confidence_score: form.ai_confidence_score ? Number(form.ai_confidence_score) : null,
        ecog_performance_status: form.ecog_performance_status ? Number(form.ecog_performance_status) : null,
        biomarkers: (() => {
          try { return JSON.parse(form.biomarkers || '{}'); } catch { return {}; }
        })(),
      };
      if (isEdit) {
        await oncologyApi.records.update(Number(id), payload);
        navigate(`/oncology/${id}`);
      } else {
        const res = await oncologyApi.records.create(payload);
        navigate(`/oncology/${res.data.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header"><h2 className="page-title"><i className="fas fa-ribbon"></i> {isEdit ? 'Edit' : 'Create'} Oncology Record</h2></div>
      <div className="card">
        <form onSubmit={submit} className="form-grid">
          <div className="detail-field full-width">
            <label className="section-label">Diagnosis Confirmed</label>
            <p className="section-help">Pathology-report based confirmation. Agentic AI should identify the cancer type, staging hints, and propose the initial treatment roadmap from uploaded reports/scans.</p>
          </div>

          <PatientSearchPicker
            value={selectedPatient}
            onSelect={(patient) => {
              setSelectedPatient(patient);
              setForm({ ...form, patient_id: patient?.id || '' });
            }}
            label="Patient"
            required
          />
          <div className="form-group"><label>Cancer Type</label><select value={form.cancer_type} onChange={(e) => setForm({ ...form, cancer_type: e.target.value })}>{CANCER_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
          <div className="form-group"><label>ICD-10 Code</label><input value={form.icd10_code || ''} onChange={(e) => setForm({ ...form, icd10_code: e.target.value })} /></div>
          <div className="form-group"><label>Diagnosis Date</label><input type="date" value={form.diagnosis_date || ''} onChange={(e) => setForm({ ...form, diagnosis_date: e.target.value })} required /></div>
          <div className="form-group checkbox-group"><label><input type="checkbox" checked={!!form.diagnosis_confirmed} onChange={(e) => setForm({ ...form, diagnosis_confirmed: e.target.checked })} /> Diagnosis Confirmed</label></div>
          <div className="form-group"><label>Confirmed By</label><select value={form.confirmed_by || 'pathology'} onChange={(e) => setForm({ ...form, confirmed_by: e.target.value })}><option value="pathology">Pathology</option><option value="ai+pathology">AI + Pathology</option><option value="clinician">Clinician</option></select></div>
          <div className="form-group"><label>AI Confidence Score</label><input type="number" min="0" max="100" value={form.ai_confidence_score} onChange={(e) => setForm({ ...form, ai_confidence_score: e.target.value })} /></div>
          <div className="form-group"><label>Clinical Stage</label><input value={form.clinical_stage || ''} onChange={(e) => setForm({ ...form, clinical_stage: e.target.value })} placeholder="e.g. IIA" /></div>
          <div className="form-group"><label>T Stage</label><input value={form.t_stage || ''} onChange={(e) => setForm({ ...form, t_stage: e.target.value })} placeholder="e.g. T2" /></div>
          <div className="form-group"><label>N Stage</label><input value={form.n_stage || ''} onChange={(e) => setForm({ ...form, n_stage: e.target.value })} placeholder="e.g. N1" /></div>
          <div className="form-group"><label>M Stage</label><input value={form.m_stage || ''} onChange={(e) => setForm({ ...form, m_stage: e.target.value })} placeholder="e.g. M0" /></div>
          <div className="form-group"><label>Histology Type</label><input value={form.histology_type || ''} onChange={(e) => setForm({ ...form, histology_type: e.target.value })} /></div>
          <div className="form-group"><label>Grade</label><input value={form.grade || ''} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Pathology Report Notes</label><textarea value={form.pathology_report_notes || ''} onChange={(e) => setForm({ ...form, pathology_report_notes: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Biomarkers (JSON)</label><textarea value={form.biomarkers} onChange={(e) => setForm({ ...form, biomarkers: e.target.value })} /></div>

          <div className="detail-field full-width">
            <label className="section-label">Treatment Planning</label>
            <p className="section-help">Treatment planning should use relevant clinical data plus payer submission. Keep this aligned to US healthcare-oriented workflows and compliance expectations.</p>
          </div>

          <div className="form-group"><label>ECOG Performance Status</label><input type="number" min="0" max="5" value={form.ecog_performance_status} onChange={(e) => setForm({ ...form, ecog_performance_status: e.target.value })} /></div>
          <div className="form-group"><label>Treatment Intent</label><input value={form.treatment_intent || ''} onChange={(e) => setForm({ ...form, treatment_intent: e.target.value })} placeholder="Curative / Palliative" /></div>
          <div className="form-group"><label>Urgency</label><select value={form.urgency_level || 'routine'} onChange={(e) => setForm({ ...form, urgency_level: e.target.value })}><option value="routine">Routine</option><option value="semi_urgent">Semi urgent</option><option value="urgent">Urgent</option></select></div>
          <div className="form-group"><label>Status</label><select value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="remission">Remission</option><option value="resolved">Resolved</option></select></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Relevant Clinical Data</label><textarea value={form.clinical_notes || ''} onChange={(e) => setForm({ ...form, clinical_notes: e.target.value })} placeholder="Relevant clinical data establishing diagnosis and planning context" /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Supporting Lab Results</label><textarea value={form.supporting_lab_results || ''} onChange={(e) => setForm({ ...form, supporting_lab_results: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Imaging Findings</label><textarea value={form.imaging_findings || ''} onChange={(e) => setForm({ ...form, imaging_findings: e.target.value })} /></div>
          <div className="form-group"><label>Recommended Surgery</label><input value={form.recommended_surgery || ''} onChange={(e) => setForm({ ...form, recommended_surgery: e.target.value })} /></div>
          <div className="form-group"><label>Recommended Chemotherapy</label><input value={form.recommended_chemotherapy || ''} onChange={(e) => setForm({ ...form, recommended_chemotherapy: e.target.value })} /></div>
          <div className="form-group"><label>Recommended Radiation</label><input value={form.recommended_radiation || ''} onChange={(e) => setForm({ ...form, recommended_radiation: e.target.value })} /></div>
          <div className="form-group"><label>Recommended Immunotherapy</label><input value={form.recommended_immunotherapy || ''} onChange={(e) => setForm({ ...form, recommended_immunotherapy: e.target.value })} /></div>
          <div className="form-group"><label>Recommended Targeted Therapy</label><input value={form.recommended_targeted_therapy || ''} onChange={(e) => setForm({ ...form, recommended_targeted_therapy: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Internal Notes</label><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

          <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" disabled={saving || !form.patient_id}>{saving ? 'Saving...' : isEdit ? 'Update Record' : 'Create Record'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(isEdit ? `/oncology/${id}` : '/oncology')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
