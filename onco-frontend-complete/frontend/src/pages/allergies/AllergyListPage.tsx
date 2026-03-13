import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { allergiesApi, patientsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import CrudModal from '../../components/CrudModal';
import PatientSearchPicker from '../../components/PatientSearchPicker';
import PaginationControls from '../../components/PaginationControls';
import { useConfirm } from '../../hooks/useConfirm';
import { useLoading } from '../../hooks/useLoading';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';

const emptyForm = {
  patient_id: '',
  allergen: '',
  reaction: '',
  severity: 'mild',
  diagnosed_year: '',
  notes: '',
};

export default function AllergyListPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [severityFilter, setSeverityFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
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
    const res = await allergiesApi.list({ page, page_size: pageSize, ...(severityFilter ? { severity: severityFilter } : {}), ...patientFilter });
    setItems(res.data.results || []);
    setCount(res.data.count || 0);
  }, [page, severityFilter, isPatient, authPatient?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedPatient(null);
    setEditingId(null);
    setOpen(false);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete allergy record', message: 'This allergy record will be deleted. Continue?', confirmText: 'Delete' });
    if (!ok) return;
    await withLoading(async () => {
      await allergiesApi.delete(id);
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: 'Allergy deleted successfully.' }));
    });
  };

  const handleEdit = async (item: any) => {
    setForm({
      patient_id: item.patient_id || '',
      allergen: item.allergen || '',
      reaction: item.reaction || '',
      severity: item.severity || 'mild',
      diagnosed_year: item.diagnosed_year || '',
      notes: item.notes || '',
    });
    setSelectedPatient(item.patient || (item.patient_id ? (await patientsApi.get(item.patient_id)).data : null));
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        patient_id: Number(form.patient_id),
        diagnosed_year: form.diagnosed_year ? Number(form.diagnosed_year) : null,
      };
      if (editingId) await allergiesApi.update(editingId, payload);
      else await allergiesApi.create(payload);
      resetForm();
      fetchData();
      dispatch(showNotice({ kind: 'success', text: editingId ? 'Allergy updated successfully.' : 'Allergy created successfully.' }));
    } finally {
      setSaving(false);
    }
  };

  const severityColor = (s: string) => {
    const map: any = { mild: '#1cc88a', moderate: '#f6c23e', severe: '#e74a3b', life_threatening: '#6f42c1' };
    return map[s] || '#858796';
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-allergies"></i> Allergies</h2>
        {canCreateClinicalData && <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fas fa-plus"></i> Add Allergy</button>}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Severity Filter</label>
            <select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}>
              <option value="">All severities</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
              <option value="life_threatening">Life threatening</option>
            </select>
          </div>
        </div>
      </div>

      <div className="result-count">{count} record(s)</div>

      <div className="card premium-table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Allergen</th>
              <th>Reaction</th>
              <th>Severity</th>
              <th>Diagnosed Year</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a: any) => (
              <tr key={a.id}>
                <td><Link to={`/patients/${a.patient_id || a.patient?.id}`}>{a.patient ? `${a.patient.first_name} ${a.patient.last_name}` : `Patient #${a.patient_id}`}</Link></td>
                <td><strong>{a.allergen}</strong></td>
                <td>{a.reaction || '-'}</td>
                <td><span className="badge" style={{ backgroundColor: severityColor(a.severity) }}>{a.severity?.toUpperCase()}</span></td>
                <td>{a.diagnosed_year || '-'}</td>
                <td className="actions">
                  {canEditClinicalData && <button onClick={() => handleEdit(a)} className="btn btn-sm btn-warning" title="Edit"><i className="fas fa-edit"></i></button>}
                  {canDeleteClinicalData && <button onClick={() => handleDelete(a.id)} className="btn btn-sm btn-danger" title="Delete"><i className="fas fa-trash"></i></button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="text-center">No records</td></tr>}
          </tbody>
        </table>
      </div>

      <PaginationControls page={page} pageSize={pageSize} total={count} onPageChange={setPage} />

      <CrudModal open={open} title={editingId ? 'Edit Allergy' : 'Add Allergy'} onClose={resetForm}>
        <form onSubmit={handleSubmit} className="form-grid">
          <PatientSearchPicker
            value={selectedPatient}
            onSelect={(patient) => {
              setSelectedPatient(patient);
              setForm({ ...form, patient_id: patient?.id || '' });
            }}
            required
          />
          <div className="form-group"><label>Allergen</label><input value={form.allergen} onChange={(e) => setForm({ ...form, allergen: e.target.value })} required /></div>
          <div className="form-group"><label>Reaction</label><input value={form.reaction} onChange={(e) => setForm({ ...form, reaction: e.target.value })} required /></div>
          <div className="form-group"><label>Severity</label><select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option><option value="life_threatening">Life threatening</option></select></div>
          <div className="form-group"><label>Diagnosed Year</label><input type="number" value={form.diagnosed_year} onChange={(e) => setForm({ ...form, diagnosed_year: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" disabled={saving || !form.patient_id}>{saving ? 'Saving...' : editingId ? 'Update Allergy' : 'Create Allergy'}</button></div>
        </form>
      </CrudModal>
    </div>
  );
}
