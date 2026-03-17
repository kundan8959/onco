import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { patientsApi, vitalsApi } from '../../api';
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
  patient_id: '', bp_systolic: '', bp_diastolic: '', diabetes: '', spo2: '', height: '', weight: '', recorded_date: '',
};

export default function VitalsListPage() {
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
    const res = await vitalsApi.list({ page, page_size: pageSize, ...patientFilter });
    setItems(res.data.results || res.data);
    setCount(res.data.count || res.data.length);
  }, [page, isPatient, authPatient?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => { setForm(emptyForm); setSelectedPatient(null); setEditingId(null); setOpen(false); };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete vitals record', message: 'This vitals record will be deleted. Continue?', confirmText: 'Delete' });
    if (!ok) return;
    await withLoading(async () => {
      await vitalsApi.delete(id);
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: 'Vitals deleted successfully.' }));
    });
  };

  const handleEdit = async (item: any) => {
    setForm({ patient_id: item.patient_id || '', bp_systolic: item.bp_systolic || '', bp_diastolic: item.bp_diastolic || '', diabetes: item.diabetes || '', spo2: item.spo2 || '', height: item.height || '', weight: item.weight || '', recorded_date: item.recorded_date ? new Date(item.recorded_date).toISOString().slice(0,16) : '' });
    setSelectedPatient(item.patient || (item.patient_id ? (await patientsApi.get(item.patient_id)).data : null));
    setEditingId(item.id); setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, patient_id: Number(form.patient_id), bp_systolic: Number(form.bp_systolic), bp_diastolic: Number(form.bp_diastolic), diabetes: Number(form.diabetes), spo2: Number(form.spo2), height: Number(form.height), weight: Number(form.weight) };
      if (editingId) await vitalsApi.update(editingId, payload); else await vitalsApi.create(payload);
      resetForm(); fetchData();
      dispatch(showNotice({ kind: 'success', text: editingId ? 'Vitals updated successfully.' : 'Vitals created successfully.' }));
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header"><h2 className="page-title"><i className="fas fa-heartbeat"></i> Vitals</h2>{canCreateClinicalData && <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fas fa-plus"></i> Add Vitals</button>}</div>
      <div className="result-count">{count} record(s)</div>
      <div className="card premium-table-card"><table className="table"><thead><tr><th>Patient</th><th>BP</th><th>Blood Sugar</th><th>SpO2</th><th>Height</th><th>Weight</th><th>BMI</th><th>Date</th><th>Actions</th></tr></thead><tbody>{items.map((v:any)=><tr key={v.id}><td><Link to={`/patients/${v.patient_id || v.patient?.id}`}>{v.patient?.first_name ? `${v.patient.first_name} ${v.patient.last_name}` : `Patient #${v.patient_id}`}</Link></td><td>{v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : '-'}</td><td>{v.diabetes ?? '-'}</td><td>{v.spo2 ? `${v.spo2}%` : '-'}</td><td>{v.height ? `${v.height} cm` : '-'}</td><td>{v.weight ? `${v.weight} kg` : '-'}</td><td>{v.bmi ? Number(v.bmi).toFixed(1) : '-'}</td><td>{v.recorded_date ? new Date(v.recorded_date).toLocaleString() : '-'}</td><td className="actions">{canEditClinicalData && <button onClick={()=>handleEdit(v)} className="btn btn-sm btn-warning"><i className="fas fa-edit"></i></button>}{canDeleteClinicalData && <button onClick={()=>handleDelete(v.id)} className="btn btn-sm btn-danger"><i className="fas fa-trash"></i></button>}</td></tr>)}{items.length===0 && <tr><td colSpan={9} className="text-center">No records</td></tr>}</tbody></table></div>
      <PaginationControls page={page} pageSize={pageSize} total={count} onPageChange={setPage} />
      <CrudModal open={open} title={editingId ? 'Edit Vitals' : 'Add Vitals'} onClose={resetForm}><form onSubmit={submit} className="form-grid"><PatientSearchPicker value={selectedPatient} onSelect={(patient)=>{ setSelectedPatient(patient); setForm({...form, patient_id: patient?.id || ''}); }} required /><div className="form-group"><label>Systolic</label><input type="number" value={form.bp_systolic} onChange={(e)=>setForm({...form, bp_systolic:e.target.value})} required /></div><div className="form-group"><label>Diastolic</label><input type="number" value={form.bp_diastolic} onChange={(e)=>setForm({...form, bp_diastolic:e.target.value})} required /></div><div className="form-group"><label>Blood Sugar</label><input type="number" step="0.01" value={form.diabetes} onChange={(e)=>setForm({...form, diabetes:e.target.value})} required /></div><div className="form-group"><label>SpO2</label><input type="number" value={form.spo2} onChange={(e)=>setForm({...form, spo2:e.target.value})} required /></div><div className="form-group"><label>Height (cm)</label><input type="number" step="0.01" value={form.height} onChange={(e)=>setForm({...form, height:e.target.value})} required /></div><div className="form-group"><label>Weight (kg)</label><input type="number" step="0.01" value={form.weight} onChange={(e)=>setForm({...form, weight:e.target.value})} required /></div><div className="form-group"><label>Recorded At</label><input type="datetime-local" value={form.recorded_date} onChange={(e)=>setForm({...form, recorded_date:e.target.value})} required /></div><div className="form-actions" style={{gridColumn:'1 / -1'}}><button className="btn btn-primary" disabled={saving || !form.patient_id}>{saving ? 'Saving...' : editingId ? 'Update Vitals' : 'Create Vitals'}</button></div></form></CrudModal>
    </div>
  );
}
