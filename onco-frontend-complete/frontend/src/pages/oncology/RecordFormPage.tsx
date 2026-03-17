import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { oncologyApi, patientsApi } from '../../api';
import PatientSearchPicker from '../../components/PatientSearchPicker';
import DateInput from '../../components/DateInput';

// All choices exactly matching Django oncology/models.py
const CANCER_TYPES = [
  // { value: 'acute_lymphocytic_leukemia', label: 'Acute Lymphocytic Leukemia (ALL)' },
  // { value: 'acute_myeloid_leukemia', label: 'Acute Myeloid Leukemia (AML)' },
  // { value: 'adrenal_cancer', label: 'Adrenal Cancer' },
  // { value: 'aids_related_cancers', label: 'AIDS-Related Cancers' },
  // { value: 'anal_cancer', label: 'Anal Cancer' },
  // { value: 'appendix_cancer', label: 'Appendix Cancer' },
  // { value: 'astrocytomas', label: 'Astrocytomas (Brain)' },
  // { value: 'atypical_teratoid_rhabdoid', label: 'Atypical Teratoid/Rhabdoid Tumor (CNS)' },
  // { value: 'basal_squamous_cell_skin', label: 'Basal and Squamous Cell Skin Cancer' },
  // { value: 'bile_duct_cancer', label: 'Bile Duct Cancer' },
  // { value: 'bladder_cancer', label: 'Bladder Cancer' },
  // { value: 'bone_cancer', label: 'Bone Cancer' },
  // { value: 'brain_spinal_cord_adults', label: 'Brain and Spinal Cord Tumors (Adults)' },
  // { value: 'brain_spinal_cord_children', label: 'Brain and Spinal Cord Tumors (Children)' },
  { value: 'breast_cancer', label: 'Breast Cancer' },
  // { value: 'breast_cancer_men', label: 'Breast Cancer in Men' },
  // { value: 'cervical_cancer', label: 'Cervical Cancer' },
  // { value: 'childhood_leukemia', label: 'Childhood Leukemia' },
  // { value: 'chronic_lymphocytic_leukemia', label: 'Chronic Lymphocytic Leukemia (CLL)' },
  // { value: 'chronic_myeloid_leukemia', label: 'Chronic Myeloid Leukemia (CML)' },
  { value: 'colorectal_cancer', label: 'Colorectal (Colon and Rectal) Cancer' },
  // { value: 'endometrial_cancer', label: 'Endometrial (Uterine) Cancer' },
  // { value: 'esophageal_cancer', label: 'Esophageal Cancer' },
  // { value: 'ewing_sarcoma', label: 'Ewing Sarcoma' },
  // { value: 'eye_cancer', label: 'Eye Cancer (Ocular Melanoma)' },
  // { value: 'gallbladder_cancer', label: 'Gallbladder Cancer' },
  // { value: 'gastrointestinal_carcinoid', label: 'Gastrointestinal Neuroendocrine (Carcinoid) Tumors' },
  // { value: 'gastrointestinal_stromal_tumor', label: 'Gastrointestinal Stromal Tumor (GIST)' },
  // { value: 'glioblastoma', label: 'Glioblastoma' },
  // { value: 'head_neck_cancers', label: 'Head and Neck Cancers' },
  // { value: 'hodgkin_lymphoma', label: 'Hodgkin Lymphoma' },
  // { value: 'kaposi_sarcoma', label: 'Kaposi Sarcoma' },
  // { value: 'kidney_cancer', label: 'Kidney Cancer' },
  // { value: 'laryngeal_hypopharyngeal', label: 'Laryngeal and Hypopharyngeal Cancer' },
  // { value: 'leukemia', label: 'Leukemia (General category)' },
  // { value: 'liver_cancer', label: 'Liver Cancer' },
  { value: 'lung_cancer', label: 'Lung Cancer' },
  // { value: 'lymphoma', label: 'Lymphoma (General category)' },
  // { value: 'melanoma_skin', label: 'Melanoma Skin Cancer' },
  // { value: 'mesothelioma', label: 'Mesothelioma' },
  // { value: 'multiple_myeloma', label: 'Multiple Myeloma' },
  // { value: 'neuroblastoma', label: 'Neuroblastoma' },
  // { value: 'ovarian_cancer', label: 'Ovarian Cancer' },
  // { value: 'pancreatic_cancer', label: 'Pancreatic Cancer' },
  // { value: 'penile_cancer', label: 'Penile Cancer' },
  { value: 'prostate_cancer', label: 'Prostate Cancer' },
  // { value: 'retinoblastoma', label: 'Retinoblastoma' },
  // { value: 'rhabdomyosarcoma', label: 'Rhabdomyosarcoma' },
  // { value: 'salivary_gland_cancer', label: 'Salivary Gland Cancer' },
  // { value: 'small_intestine_cancer', label: 'Small Intestine Cancer' },
  // { value: 'soft_tissue_sarcoma', label: 'Soft Tissue Sarcoma' },
  // { value: 'testicular_cancer', label: 'Testicular Cancer' },
  // { value: 'thyroid_cancer', label: 'Thyroid Cancer' },
  // { value: 'uterine_sarcoma', label: 'Uterine Sarcoma' },
  // { value: 'vaginal_cancer', label: 'Vaginal Cancer' },
  // { value: 'vulvar_cancer', label: 'Vulvar Cancer' },
  // { value: 'other', label: 'Other Cancer Type' },
];

const T_STAGES = [
  { value: '', label: '-- Select T Stage --' },
  { value: 'TX', label: 'TX - Primary tumor cannot be assessed' },
  { value: 'T0', label: 'T0 - No evidence of primary tumor' },
  { value: 'Tis', label: 'Tis - Carcinoma in situ' },
  { value: 'T1', label: 'T1' }, { value: 'T1a', label: 'T1a' }, { value: 'T1b', label: 'T1b' }, { value: 'T1c', label: 'T1c' },
  { value: 'T2', label: 'T2' }, { value: 'T2a', label: 'T2a' }, { value: 'T2b', label: 'T2b' },
  { value: 'T3', label: 'T3' }, { value: 'T3a', label: 'T3a' }, { value: 'T3b', label: 'T3b' },
  { value: 'T4', label: 'T4' }, { value: 'T4a', label: 'T4a' }, { value: 'T4b', label: 'T4b' },
];

const N_STAGES = [
  { value: '', label: '-- Select N Stage --' },
  { value: 'NX', label: 'NX - Cannot be assessed' },
  { value: 'N0', label: 'N0 - No regional lymph node metastasis' },
  { value: 'N1', label: 'N1' }, { value: 'N1a', label: 'N1a' }, { value: 'N1b', label: 'N1b' }, { value: 'N1c', label: 'N1c' },
  { value: 'N2', label: 'N2' }, { value: 'N2a', label: 'N2a' }, { value: 'N2b', label: 'N2b' },
  { value: 'N3', label: 'N3' }, { value: 'N3a', label: 'N3a' }, { value: 'N3b', label: 'N3b' },
];

const M_STAGES = [
  { value: '', label: '-- Select M Stage --' },
  { value: 'M0', label: 'M0 - No distant metastasis' },
  { value: 'M1', label: 'M1 - Distant metastasis present' },
  { value: 'M1a', label: 'M1a' }, { value: 'M1b', label: 'M1b' }, { value: 'M1c', label: 'M1c' },
  { value: 'MX', label: 'MX - Cannot be assessed' },
];

const CLINICAL_STAGES = [
  { value: '', label: '-- Select Stage --' },
  { value: '0', label: 'Stage 0 (Carcinoma in situ)' },
  { value: 'I', label: 'Stage I' }, { value: 'IA', label: 'Stage IA' }, { value: 'IB', label: 'Stage IB' }, { value: 'IC', label: 'Stage IC' },
  { value: 'II', label: 'Stage II' }, { value: 'IIA', label: 'Stage IIA' }, { value: 'IIB', label: 'Stage IIB' }, { value: 'IIC', label: 'Stage IIC' },
  { value: 'III', label: 'Stage III' }, { value: 'IIIA', label: 'Stage IIIA' }, { value: 'IIIB', label: 'Stage IIIB' }, { value: 'IIIC', label: 'Stage IIIC' },
  { value: 'IV', label: 'Stage IV' }, { value: 'IVA', label: 'Stage IVA' }, { value: 'IVB', label: 'Stage IVB' }, { value: 'IVC', label: 'Stage IVC' },
];

const GRADE_CHOICES = [
  { value: '', label: '-- Select Grade --' },
  { value: 'GX', label: 'GX - Grade cannot be assessed' },
  { value: 'G1', label: 'G1 - Well differentiated' },
  { value: 'G2', label: 'G2 - Moderately differentiated' },
  { value: 'G3', label: 'G3 - Poorly differentiated' },
  { value: 'G4', label: 'G4 - Undifferentiated' },
];

const CONFIRMED_BY = [
  { value: 'ai', label: 'AI Analysis' },
  { value: 'oncologist', label: 'Oncologist' },
  { value: 'pathologist', label: 'Pathologist' },
  { value: 'ai_oncologist', label: 'AI + Oncologist Verified' },
];

const TREATMENT_INTENT = [
  { value: '', label: '-- Select Intent --' },
  { value: 'curative', label: 'Curative' },
  { value: 'palliative', label: 'Palliative' },
  { value: 'adjuvant', label: 'Adjuvant' },
  { value: 'neoadjuvant', label: 'Neoadjuvant' },
];

const URGENCY = [
  { value: 'routine', label: 'Routine (> 1 month)' },
  { value: 'semi_urgent', label: 'Semi-Urgent (< 1 month)' },
  { value: 'urgent', label: 'Urgent (< 1 week)' },
  { value: 'emergent', label: 'Emergent (< 24 hours)' },
];

const STATUS_CHOICES = [
  { value: 'active', label: 'Active' },
  { value: 'remission', label: 'In Remission' },
  { value: 'recurrent', label: 'Recurrent' },
  { value: 'metastatic', label: 'Metastatic' },
];

const ECOG_STATUS = [
  { value: '', label: '-- Select ECOG --' },
  { value: '0', label: '0 - Fully active, no restrictions' },
  { value: '1', label: '1 - Restricted in physically strenuous activity' },
  { value: '2', label: '2 - Ambulatory, capable of self-care' },
  { value: '3', label: '3 - Limited self-care, confined to bed/chair >50%' },
  { value: '4', label: '4 - Completely disabled' },
];

const emptyForm = {
  patient_id: '',
  cancer_type: 'breast_cancer',
  other_cancer_type_details: '',
  icd10_code: '',
  diagnosis_date: '',
  diagnosis_confirmed: false,
  confirmed_by: 'oncologist',
  ai_confidence_score: '',
  t_stage: '',
  n_stage: '',
  m_stage: '',
  clinical_stage: '',
  grade: '',
  histology_type: '',
  tumor_size_cm: '',
  lymph_node_involvement: false,
  metastasis_present: false,
  biomarkers: '{}',
  ecog_performance_status: '',
  supporting_lab_results: '',
  imaging_findings: '',
  comorbidities: '',
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
  is_primary: true,
};

const FG = ({ label, required, children, full }: any) => (
  <div className="form-group" style={{ gridColumn: full ? '1 / -1' : undefined }}>
    <label>{label}{required && ' *'}</label>
    {children}
  </div>
);

export default function RecordFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (!isEdit) return;
    oncologyApi.records.get(Number(id)).then(async (res) => {
      setForm({
        ...emptyForm,
        ...res.data,
        ai_confidence_score: res.data.ai_confidence_score ?? '',
        biomarkers: JSON.stringify(res.data.biomarkers || {}, null, 2),
        ecog_performance_status: res.data.ecog_performance_status ?? '',
        tumor_size_cm: res.data.tumor_size_cm ?? '',
      });
      if (res.data.patient) setSelectedPatient(res.data.patient);
      else if (res.data.patient_id) setSelectedPatient((await patientsApi.get(res.data.patient_id)).data);
    });
  }, [id, isEdit]);

  const set = (key: string, value: any) => setForm((prev: any) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        patient_id: Number(form.patient_id),
        diagnosis_confirmed: !!form.diagnosis_confirmed,
        lymph_node_involvement: !!form.lymph_node_involvement,
        metastasis_present: !!form.metastasis_present,
        is_primary: !!form.is_primary,
        ai_confidence_score: form.ai_confidence_score ? Number(form.ai_confidence_score) : null,
        ecog_performance_status: form.ecog_performance_status !== '' ? Number(form.ecog_performance_status) : null,
        tumor_size_cm: form.tumor_size_cm ? Number(form.tumor_size_cm) : null,
        biomarkers: (() => { try { return JSON.parse(form.biomarkers || '{}'); } catch { return {}; } })(),
        other_cancer_type_details: form.cancer_type === 'other' ? form.other_cancer_type_details : null,
      };
      if (isEdit) {
        await oncologyApi.records.update(Number(id), payload);
        navigate(`/oncology/${id}`);
      } else {
        const res = await oncologyApi.records.create(payload);
        navigate(`/oncology/${res.data.id}`);
      }
    } catch (err: any) {
      if (err.response?.data) setErrors(err.response.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-ribbon"></i> {isEdit ? 'Edit' : 'Create'} Oncology Record</h2>
      </div>

      <div className="card">
        <form onSubmit={submit}>

          {/* ── SECTION 1: DIAGNOSIS CONFIRMED ── */}
          <div style={{ marginBottom: 8 }}>
            <h3 className="section-title" style={{ color: '#4e73df' }}>
              <i className="fas fa-microscope" style={{ marginRight: 8 }}></i>Diagnosis Confirmed
            </h3>
            <p className="section-help">Pathology-confirmed cancer details. AI will extract staging and type from uploaded reports.</p>
          </div>

          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <PatientSearchPicker
                value={selectedPatient}
                onSelect={(patient) => { setSelectedPatient(patient); set('patient_id', patient?.id || ''); }}
                label="Patient"
                required
              />
            </div>

            <FG label="Cancer Type" required>
              <select value={form.cancer_type} onChange={e => set('cancer_type', e.target.value)}>
                {CANCER_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FG>

            {form.cancer_type === 'other' && (
              <FG label="Specify Cancer Type *" full>
                <input value={form.other_cancer_type_details || ''} onChange={e => set('other_cancer_type_details', e.target.value)} placeholder="Describe the cancer type in detail" required />
                {errors.other_cancer_type_details && <span className="field-error">{errors.other_cancer_type_details}</span>}
              </FG>
            )}

            <FG label="ICD-10 Code">
              <input value={form.icd10_code || ''} onChange={e => set('icd10_code', e.target.value)} placeholder="e.g. C50.911" />
            </FG>

            <FG label="Diagnosis Date *">
              <DateInput value={form.diagnosis_date || ''} onChange={v => set('diagnosis_date', v)} required />
            </FG>

            <FG label="Confirmed By">
              <select value={form.confirmed_by || 'oncologist'} onChange={e => set('confirmed_by', e.target.value)}>
                {CONFIRMED_BY.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FG>

            <FG label="AI Confidence Score (0–100)">
              <input type="number" min="0" max="100" value={form.ai_confidence_score || ''} onChange={e => set('ai_confidence_score', e.target.value)} placeholder="e.g. 92" />
            </FG>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={!!form.diagnosis_confirmed} onChange={e => set('diagnosis_confirmed', e.target.checked)} />
                Diagnosis Confirmed
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={!!form.is_primary} onChange={e => set('is_primary', e.target.checked)} />
                Primary Cancer (not metastatic)
              </label>
            </div>
          </div>

          {/* ── TNM STAGING ── */}
          <h3 className="section-title" style={{ marginTop: 24 }}>TNM Staging (AJCC Standard)</h3>
          <div className="form-grid">
            <FG label="T Stage (Tumor)">
              <select value={form.t_stage || ''} onChange={e => set('t_stage', e.target.value)}>
                {T_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FG>

            <FG label="N Stage (Lymph Nodes)">
              <select value={form.n_stage || ''} onChange={e => set('n_stage', e.target.value)}>
                {N_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FG>

            <FG label="M Stage (Metastasis)">
              <select value={form.m_stage || ''} onChange={e => set('m_stage', e.target.value)}>
                {M_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FG>

            <FG label="Clinical Stage (Overall)">
              <select value={form.clinical_stage || ''} onChange={e => set('clinical_stage', e.target.value)}>
                {CLINICAL_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FG>

            <FG label="Tumor Grade">
              <select value={form.grade || ''} onChange={e => set('grade', e.target.value)}>
                {GRADE_CHOICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FG>

            <FG label="Histology Type">
              <input value={form.histology_type || ''} onChange={e => set('histology_type', e.target.value)} placeholder="e.g. Adenocarcinoma, Squamous cell" />
            </FG>

            <FG label="Tumor Size (cm)">
              <input type="number" step="0.01" min="0" value={form.tumor_size_cm || ''} onChange={e => set('tumor_size_cm', e.target.value)} placeholder="e.g. 2.5" />
            </FG>

            <FG label="Status">
              <select value={form.status || 'active'} onChange={e => set('status', e.target.value)}>
                {STATUS_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FG>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={!!form.lymph_node_involvement} onChange={e => set('lymph_node_involvement', e.target.checked)} />
                Lymph Node Involvement
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" checked={!!form.metastasis_present} onChange={e => set('metastasis_present', e.target.checked)} />
                Distant Metastasis Present
              </label>
            </div>

            <FG label="Biomarkers (JSON)" full>
              <textarea
                value={form.biomarkers}
                onChange={e => set('biomarkers', e.target.value)}
                rows={3}
                placeholder={'{"ER": "Positive", "PR": "Negative", "HER2": "2+"}'}
              />
            </FG>
          </div>

          {/* ── SECTION 2: TREATMENT PLANNING ── */}
          <div style={{ marginTop: 28, marginBottom: 8 }}>
            <h3 className="section-title" style={{ color: '#1cc88a' }}>
              <i className="fas fa-notes-medical" style={{ marginRight: 8 }}></i>Treatment Planning
            </h3>
            <p className="section-help">Clinical data, ECOG status, and recommended treatment roadmap.</p>
          </div>

          <div className="form-grid">
            <FG label="ECOG Performance Status">
              <select value={form.ecog_performance_status ?? ''} onChange={e => set('ecog_performance_status', e.target.value)}>
                {ECOG_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </FG>

            <FG label="Treatment Intent">
              <select value={form.treatment_intent || ''} onChange={e => set('treatment_intent', e.target.value)}>
                {TREATMENT_INTENT.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FG>

            <FG label="Urgency Level">
              <select value={form.urgency_level || 'routine'} onChange={e => set('urgency_level', e.target.value)}>
                {URGENCY.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </FG>

            <FG label="Supporting Lab Results" full>
              <textarea rows={3} value={form.supporting_lab_results || ''} onChange={e => set('supporting_lab_results', e.target.value)} placeholder="CBC, BMP, tumor markers, etc." />
            </FG>

            <FG label="Imaging Findings" full>
              <textarea rows={3} value={form.imaging_findings || ''} onChange={e => set('imaging_findings', e.target.value)} placeholder="CT, MRI, PET scan findings" />
            </FG>

            <FG label="Comorbidities" full>
              <textarea rows={2} value={form.comorbidities || ''} onChange={e => set('comorbidities', e.target.value)} placeholder="Existing conditions affecting treatment" />
            </FG>

            <FG label="Clinical Notes" full>
              <textarea rows={3} value={form.clinical_notes || ''} onChange={e => set('clinical_notes', e.target.value)} placeholder="Additional clinical notes from diagnosis and planning" />
            </FG>

            <FG label="Recommended Surgery">
              <input value={form.recommended_surgery || ''} onChange={e => set('recommended_surgery', e.target.value)} placeholder="e.g. Lumpectomy, Mastectomy" />
            </FG>

            <FG label="Recommended Chemotherapy">
              <input value={form.recommended_chemotherapy || ''} onChange={e => set('recommended_chemotherapy', e.target.value)} placeholder="e.g. AC-T, FOLFOX" />
            </FG>

            <FG label="Recommended Radiation">
              <input value={form.recommended_radiation || ''} onChange={e => set('recommended_radiation', e.target.value)} placeholder="e.g. IMRT, 50 Gy" />
            </FG>

            <FG label="Recommended Immunotherapy">
              <input value={form.recommended_immunotherapy || ''} onChange={e => set('recommended_immunotherapy', e.target.value)} placeholder="e.g. Pembrolizumab" />
            </FG>

            <FG label="Recommended Targeted Therapy">
              <input value={form.recommended_targeted_therapy || ''} onChange={e => set('recommended_targeted_therapy', e.target.value)} placeholder="e.g. Trastuzumab, Imatinib" />
            </FG>

            <FG label="Internal Notes" full>
              <textarea rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
            </FG>
          </div>

          {/* Error display */}
          {errors.non_field_errors && <div className="alert alert-danger">{errors.non_field_errors}</div>}
          {errors.detail && <div className="alert alert-danger">{errors.detail}</div>}
          {errors.cancer_type && <div className="alert alert-danger">{errors.cancer_type}</div>}

          <div className="form-actions" style={{ marginTop: 24 }}>
            <button className="btn btn-primary" disabled={saving || !form.patient_id}>
              {saving ? 'Saving…' : isEdit ? 'Update Record' : 'Create Record'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(isEdit ? `/oncology/${id}` : '/oncology')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
