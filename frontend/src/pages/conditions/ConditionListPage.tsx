import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { conditionsApi, patientsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import CrudModal from '../../components/CrudModal';
import PatientSearchPicker from '../../components/PatientSearchPicker';
import { useConfirm } from '../../hooks/useConfirm';
import { useLoading } from '../../hooks/useLoading';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';

// Matches Django ChronicCondition.CONDITION_CHOICES exactly
const CONDITION_CHOICES = [
  { value: '', label: '-- Select Condition --' },
  { value: 'diabetes_type1', label: 'Diabetes Type 1' },
  { value: 'diabetes_type2', label: 'Diabetes Type 2' },
  { value: 'hypertension', label: 'Hypertension (High Blood Pressure)' },
  { value: 'asthma', label: 'Asthma' },
  { value: 'copd', label: 'COPD (Chronic Obstructive Pulmonary Disease)' },
  { value: 'heart_disease', label: 'Heart Disease' },
  { value: 'coronary_artery_disease', label: 'Coronary Artery Disease' },
  { value: 'congestive_heart_failure', label: 'Congestive Heart Failure' },
  { value: 'kidney_disease', label: 'Chronic Kidney Disease' },
  { value: 'liver_disease', label: 'Chronic Liver Disease' },
  { value: 'thyroid_hyper', label: 'Hyperthyroidism' },
  { value: 'thyroid_hypo', label: 'Hypothyroidism' },
  { value: 'cancer_breast', label: 'Breast Cancer' },
  { value: 'cancer_lung', label: 'Lung Cancer' },
  { value: 'cancer_colon', label: 'Colon Cancer' },
  { value: 'cancer_prostate', label: 'Prostate Cancer' },
  { value: 'cancer_other', label: 'Other Cancer' },
  { value: 'arthritis', label: 'Arthritis' },
  { value: 'osteoporosis', label: 'Osteoporosis' },
  { value: 'epilepsy', label: 'Epilepsy' },
  { value: 'parkinsons', label: "Parkinson's Disease" },
  { value: 'alzheimers', label: "Alzheimer's Disease" },
  { value: 'depression', label: 'Depression' },
  { value: 'anxiety', label: 'Anxiety Disorder' },
  { value: 'bipolar', label: 'Bipolar Disorder' },
  { value: 'hiv_aids', label: 'HIV/AIDS' },
  { value: 'hepatitis_b', label: 'Hepatitis B' },
  { value: 'hepatitis_c', label: 'Hepatitis C' },
  { value: 'stroke', label: 'Stroke History' },
  { value: 'other', label: 'Other Chronic Condition' },
];

const STATUS_CHOICES = [
  { value: 'active', label: 'Active' },
  { value: 'controlled', label: 'Controlled' },
  { value: 'in_remission', label: 'In Remission' },
  { value: 'resolved', label: 'Resolved' },
];

const emptyForm = {
  patient_id: '',
  condition: '',
  condition_name_other: '',
  diagnosed_year: '',
  status: 'active',
  diagnosed_by: '',
  treatment: '',
  notes: '',
};

export default function ConditionListPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();
  const { withLoading } = useLoading();
  const { canCreateClinicalData, canEditClinicalData, canDeleteClinicalData } = usePermissions();
  const dispatch = useAppDispatch();
  const { user, patient: authPatient } = useAuth();
  const isPatient = user?.role === 'patient';
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    const patientFilter = isPatient && authPatient?.id ? { patient_id: authPatient.id } : {};
    const res = await conditionsApi.list({ page, page_size: pageSize, ...patientFilter });
    setItems(res.data.results || res.data);
    setCount(res.data.count || res.data.length);
  }, [page, isPatient, authPatient?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const totalPages = Math.ceil(count / pageSize);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedPatient(null);
    setEditingId(null);
    setOpen(false);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete condition', message: 'This chronic condition record will be deleted. Continue?', confirmText: 'Delete' });
    if (!ok) return;
    await withLoading(async () => {
      await conditionsApi.delete(id);
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: 'Condition deleted successfully.' }));
    });
  };

  const handleEdit = async (item: any) => {
    setForm({
      patient_id: item.patient_id || '',
      condition: item.condition || '',
      condition_name_other: item.condition_name_other || '',
      diagnosed_year: item.diagnosed_year || '',
      status: item.status || 'active',
      diagnosed_by: item.diagnosed_by || '',
      treatment: item.treatment || '',
      notes: item.notes || '',
    });
    setSelectedPatient(item.patient || (item.patient_id ? (await patientsApi.get(item.patient_id)).data : null));
    setEditingId(item.id);
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, patient_id: Number(form.patient_id), diagnosed_year: Number(form.diagnosed_year) };
      if (editingId) await conditionsApi.update(editingId, payload);
      else await conditionsApi.create(payload);
      resetForm();
      fetchData();
      dispatch(showNotice({ kind: 'success', text: editingId ? 'Condition updated successfully.' : 'Condition created successfully.' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-notes-medical"></i> Chronic Conditions</h2>
        {canCreateClinicalData && <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fas fa-plus"></i> Add Condition</button>}
      </div>
      <div className="result-count">{count} record(s)</div>
      <div className="card premium-table-card">
        <table className="table">
          <thead><tr><th>Patient</th><th>Condition</th><th>Diagnosed Year</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((c: any) => (
              <tr key={c.id}>
                <td><Link to={`/patients/${c.patient_id || c.patient?.id}`}>{c.patient ? `${c.patient.first_name} ${c.patient.last_name}` : `Patient #${c.patient_id}`}</Link></td>
                <td><strong>{c.condition_display || c.condition}</strong></td>
                <td>{c.diagnosed_year || '-'}</td>
                <td><span className={`badge ${c.status === 'active' ? 'badge-danger' : c.status === 'managed' ? 'badge-success' : 'badge-secondary'}`}>{c.status?.toUpperCase()}</span></td>
                <td>{c.notes || '-'}</td>
                <td className="actions">{canEditClinicalData && <button onClick={() => handleEdit(c)} className="btn btn-sm btn-warning"><i className="fas fa-edit"></i></button>}{canDeleteClinicalData && <button onClick={() => handleDelete(c.id)} className="btn btn-sm btn-danger"><i className="fas fa-trash"></i></button>}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="text-center">No records</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm">Prev</button>{Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : ''}`} onClick={() => setPage(p)}>{p}</button>)}<button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-sm">Next</button></div>}
      <CrudModal open={open} title={editingId ? 'Edit Condition' : 'Add Condition'} onClose={resetForm}>
        <form onSubmit={submit} className="form-grid">
          <PatientSearchPicker value={selectedPatient} onSelect={(patient) => { setSelectedPatient(patient); setForm({ ...form, patient_id: patient?.id || '' }); }} required />
          <div className="form-group"><label>Condition *</label><select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} required>{CONDITION_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          {form.condition === 'other' && <div className="form-group"><label>Specify Condition *</label><input value={form.condition_name_other} onChange={(e) => setForm({ ...form, condition_name_other: e.target.value })} placeholder="Describe the condition" required /></div>}
          <div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUS_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          <div className="form-group"><label>Diagnosed Year</label><input type="number" value={form.diagnosed_year} onChange={(e) => setForm({ ...form, diagnosed_year: e.target.value })} required /></div>
          <div className="form-group"><label>Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="active">Active</option><option value="managed">Managed</option><option value="controlled">Controlled</option><option value="in_remission">In remission</option><option value="resolved">Resolved</option></select></div>
          <div className="form-group"><label>Diagnosed By</label><input value={form.diagnosed_by} onChange={(e) => setForm({ ...form, diagnosed_by: e.target.value })} /></div>
          <div className="form-group"><label>Treatment</label><input value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" disabled={saving || !form.patient_id}>{saving ? 'Saving...' : editingId ? 'Update Condition' : 'Create Condition'}</button></div>
        </form>
      </CrudModal>
    </div>
  );
}
