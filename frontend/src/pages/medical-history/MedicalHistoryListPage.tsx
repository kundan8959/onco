import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { medicalHistoryApi, patientsApi } from '../../api';
import CrudModal from '../../components/CrudModal';
import PatientSearchPicker from '../../components/PatientSearchPicker';
import { usePermissions } from '../../hooks/usePermissions';

// Matches Django MedicalHistory.DISEASE_CHOICES
const DISEASE_CHOICES = [
  { value: 'none', label: 'None' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'hypertension', label: 'Hypertension (High Blood Pressure)' },
  { value: 'heart_disease', label: 'Heart Disease' },
  { value: 'stroke', label: 'Stroke' },
  { value: 'cancer', label: 'Cancer' },
  { value: 'asthma', label: 'Asthma' },
  { value: 'kidney_disease', label: 'Kidney Disease' },
  { value: 'liver_disease', label: 'Liver Disease' },
  { value: 'thyroid_disorder', label: 'Thyroid Disorder' },
  { value: 'alzheimers', label: "Alzheimer's Disease" },
  { value: 'mental_illness', label: 'Mental Illness' },
  { value: 'arthritis', label: 'Arthritis' },
  { value: 'osteoporosis', label: 'Osteoporosis' },
  { value: 'other', label: 'Other' },
];

const emptyForm = {
  patient_id: '',
  mother_condition: 'none',
  mother_condition_other: '',
  father_condition: '',
  father_condition_other: '',
  additional_family_history: '',
};

export default function MedicalHistoryListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { canCreateClinicalData, canEditClinicalData } = usePermissions();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicalHistoryApi.list();
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      const enriched = data.map((h: any) => ({
        ...h,
        patient_id: h.patient_id || h.patient?.id,
        patient_name: h.patient ? `${h.patient.first_name} ${h.patient.last_name}` : `Patient #${h.patient_id}`,
      }));
      setItems(enriched);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const edit = async (h: any) => {
    setForm({ ...emptyForm, ...h, patient_id: h.patient_id || '' });
    setSelectedPatient(h.patient || (h.patient_id ? (await patientsApi.get(h.patient_id)).data : null));
    setOpen(true);
  };

  const reset = () => {
    setOpen(false);
    setForm(emptyForm);
    setSelectedPatient(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, created_at, updated_at, patient, patient_name, ...payload } = form as any;
      await medicalHistoryApi.upsert({ ...payload, patient_id: Number(payload.patient_id) });
      reset();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-dna"></i> Medical History (Family)</h2>
        {canCreateClinicalData && <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fas fa-plus"></i> Add / Update History</button>}
      </div>
      <div className="result-count">{items.length} record(s)</div>
      <div className="card">
        {loading ? <p className="text-center p-4">Loading...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Mother's Condition</th>
                <th>Father's Condition</th>
                <th>Additional Family History</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((h: any) => (
                <tr key={h.patient_id}>
                  <td><Link to={`/patients/${h.patient_id}`}>{h.patient_name}</Link></td>
                  <td>{h.mother_condition === 'other' ? h.mother_condition_other || 'Other' : h.mother_condition || '-'}</td>
                  <td>{h.father_condition === 'other' ? h.father_condition_other || 'Other' : h.father_condition || '-'}</td>
                  <td>{h.additional_family_history || '-'}</td>
                  <td>{canEditClinicalData && <button className="btn btn-sm btn-warning" onClick={() => edit(h)}><i className="fas fa-edit"></i></button>}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center">No family history records</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <CrudModal open={open} title="Medical History" onClose={reset}>
        <form onSubmit={submit} className="form-grid">
          <PatientSearchPicker value={selectedPatient} onSelect={(patient) => { setSelectedPatient(patient); setForm({ ...form, patient_id: patient?.id || '' }); }} required />
          <div className="form-group"><label>Mother's Condition</label><select value={form.mother_condition || 'none'} onChange={(e) => setForm({ ...form, mother_condition: e.target.value })}>{DISEASE_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          {form.mother_condition === 'other' && <div className="form-group"><label>Mother's Condition (specify) *</label><input value={form.mother_condition_other || ''} onChange={(e) => setForm({ ...form, mother_condition_other: e.target.value })} required /></div>}
          <div className="form-group"><label>Father's Condition</label><select value={form.father_condition || 'none'} onChange={(e) => setForm({ ...form, father_condition: e.target.value })}>{DISEASE_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          {form.father_condition === 'other' && <div className="form-group"><label>Father's Condition (specify) *</label><input value={form.father_condition_other || ''} onChange={(e) => setForm({ ...form, father_condition_other: e.target.value })} required /></div>}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Additional Family History</label><textarea value={form.additional_family_history || ''} onChange={(e) => setForm({ ...form, additional_family_history: e.target.value })} /></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" disabled={saving || !form.patient_id}>{saving ? 'Saving...' : 'Save History'}</button></div>
        </form>
      </CrudModal>
    </div>
  );
}
