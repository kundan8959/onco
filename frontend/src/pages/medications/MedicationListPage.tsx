import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { medicationsApi, patientsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import CrudModal from '../../components/CrudModal';
import PatientSearchPicker from '../../components/PatientSearchPicker';
import PaginationControls from '../../components/PaginationControls';
import { useConfirm } from '../../hooks/useConfirm';
import { useLoading } from '../../hooks/useLoading';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';
import DateInput from '../../components/DateInput';

const emptyForm = {
  patient_id: '',
  medicine_name: '',
  dosage: '',
  frequency: '',
  route: '',
  start_date: '',
  end_date: '',
  prescribed_by: '',
  reason: '',
  notes: '',
  is_active: true,
};

export default function MedicationListPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [activeFilter, setActiveFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const { confirm } = useConfirm();
  const { withLoading } = useLoading();
  const { canCreateClinicalData, canEditClinicalData, canDeleteClinicalData } = usePermissions();
  const dispatch = useAppDispatch();
  const { user, patient: authPatient } = useAuth();
  const isPatient = user?.role === 'patient';
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    const patientFilter = isPatient && authPatient?.id ? { patient_id: authPatient.id } : {};
    const res = await medicationsApi.list({ page, page_size: pageSize, ...(activeFilter !== '' ? { is_active: activeFilter } : {}), ...patientFilter });
    setItems(res.data.results || []);
    setCount(res.data.count || 0);
  }, [page, activeFilter, isPatient, authPatient?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedPatient(null);
    setEditingId(null);
    setOpen(false);
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete medication', message: 'This medication entry will be deleted. Continue?', confirmText: 'Delete' });
    if (!ok) return;
    await withLoading(async () => {
      await medicationsApi.delete(id);
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: 'Medication deleted successfully.' }));
    });
  };

  const handleEdit = async (item: any) => {
    setForm({
      patient_id: item.patient_id || '',
      medicine_name: item.medicine_name || '',
      dosage: item.dosage || '',
      frequency: item.frequency || '',
      route: item.route || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      prescribed_by: item.prescribed_by || '',
      reason: item.reason || '',
      notes: item.notes || '',
      is_active: !!item.is_active,
    });
    setSelectedPatient(item.patient || (item.patient_id ? (await patientsApi.get(item.patient_id)).data : null));
    setEditingId(item.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, patient_id: Number(form.patient_id) };
      if (editingId) await medicationsApi.update(editingId, payload);
      else await medicationsApi.create(payload);
      resetForm();
      fetchData();
      dispatch(showNotice({ kind: 'success', text: editingId ? 'Medication updated successfully.' : 'Medication created successfully.' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-pills"></i> Medications</h2>
        {canCreateClinicalData && <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fas fa-plus"></i> Add Medication</button>}
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Medication Status</label>
            <select value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
              <option value="">All medications</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
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
              <th>Medicine</th>
              <th>Dosage</th>
              <th>Frequency</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m: any) => (
              <tr key={m.id}>
                <td><Link to={`/patients/${m.patient_id || m.patient?.id}`}>{m.patient ? `${m.patient.first_name} ${m.patient.last_name}` : `Patient #${m.patient_id}`}</Link></td>
                <td><strong>{m.medicine_name}</strong></td>
                <td>{m.dosage || '-'}</td>
                <td>{m.frequency || '-'}</td>
                <td>{m.start_date || '-'}</td>
                <td>{m.end_date || '-'}</td>
                <td><span className={`badge ${m.is_active ? 'badge-success' : 'badge-secondary'}`}>{m.is_active ? 'YES' : 'NO'}</span></td>
                <td className="actions">
                  {canEditClinicalData && <button onClick={() => handleEdit(m)} className="btn btn-sm btn-warning"><i className="fas fa-edit"></i></button>}
                  {canDeleteClinicalData && <button onClick={() => handleDelete(m.id)} className="btn btn-sm btn-danger"><i className="fas fa-trash"></i></button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8} className="text-center">No records</td></tr>}
          </tbody>
        </table>
      </div>
      <PaginationControls page={page} pageSize={pageSize} total={count} onPageChange={setPage} />

      <CrudModal open={open} title={editingId ? 'Edit Medication' : 'Add Medication'} onClose={resetForm}>
        <form onSubmit={handleSubmit} className="form-grid">
          <PatientSearchPicker
            value={selectedPatient}
            onSelect={(patient) => {
              setSelectedPatient(patient);
              setForm({ ...form, patient_id: patient?.id || '' });
            }}
            required
          />
          <div className="form-group"><label>Medicine</label><input value={form.medicine_name} onChange={(e) => setForm({ ...form, medicine_name: e.target.value })} required /></div>
          <div className="form-group"><label>Dosage</label><input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} /></div>
          <div className="form-group"><label>Frequency</label><select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}><option value="">-- Select --</option><option value="once_daily">Once Daily</option><option value="twice_daily">Twice Daily</option><option value="thrice_daily">Thrice Daily</option><option value="four_times_daily">Four Times Daily</option><option value="as_needed">As Needed</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
          <div className="form-group"><label>Route</label><input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} /></div>
          <div className="form-group"><label>Start Date</label><DateInput value={form.start_date} onChange={v => setForm({ ...form, start_date: v })} /></div>
          <div className="form-group"><label>End Date</label><DateInput value={form.end_date} onChange={v => setForm({ ...form, end_date: v })} /></div>
          <div className="form-group"><label>Prescribed By</label><input value={form.prescribed_by} onChange={(e) => setForm({ ...form, prescribed_by: e.target.value })} /></div>
          <div className="form-group"><label>Reason</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="form-group checkbox-group"><label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" disabled={saving || !form.patient_id}>{saving ? 'Saving...' : editingId ? 'Update Medication' : 'Create Medication'}</button></div>
        </form>
      </CrudModal>
    </div>
  );
}
