import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { oncologyApi, patientsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import CrudModal from '../../components/CrudModal';
import PatientSearchPicker from '../../components/PatientSearchPicker';
import PaginationControls from '../../components/PaginationControls';
import { useConfirm } from '../../hooks/useConfirm';
import { useLoading } from '../../hooks/useLoading';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';
import { usePermissions } from '../../hooks/usePermissions';
import DateInput from '../../components/DateInput';

const emptyForm = {
  oncology_record_id: '',
  symptom_name: '',
  severity: 'mild',
  onset_date: '',
  progression: 'stable',
  pain_score: 0,
  notes: '',
  reported_date: '',
};

export default function SymptomListPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [linkedRecord, setLinkedRecord] = useState<any>(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();
  const { withLoading } = useLoading();
  const dispatch = useAppDispatch();
  const { canCreateSymptom, canEditSymptom, canDeleteSymptom, canManageSymptomActions } = usePermissions();
  const { user, patient: authPatient } = useAuth();
  const isPatient = user?.role === 'patient';
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    const patientFilter = isPatient && authPatient?.id ? { patient_id: authPatient.id } : {};
    const res = await oncologyApi.symptoms.list({ page, page_size: pageSize, ...patientFilter });
    const all = res.data.results || [];
    const filtered = severityFilter ? all.filter((item: any) => item.severity === severityFilter) : all;
    setItems(filtered);
    setCount(res.data.count || 0);
  }, [page, severityFilter, isPatient, authPatient?.id]);

  // When a patient opens the "Add Symptom" form, auto-populate their oncology record
  useEffect(() => {
    if (open && isPatient && authPatient && !editingId) {
      setSelectedPatient(authPatient);
      resolveRecordForPatient(authPatient);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedPatient(null);
    setLinkedRecord(null);
    setEditingId(null);
    setOpen(false);
  };

  const resolveRecordForPatient = async (patient: any) => {
    const res = await oncologyApi.records.list({ patient_id: patient.id, page_size: 1 });
    const record = (res.data.results || res.data || [])[0] || null;
    setLinkedRecord(record);
    setForm((prev: any) => ({ ...prev, oncology_record_id: record?.id || '' }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, oncology_record_id: Number(form.oncology_record_id), pain_score: Number(form.pain_score) };
      if (editingId) await oncologyApi.symptoms.update(editingId, payload);
      else await oncologyApi.symptoms.create(payload);
      resetForm();
      fetchData();
      dispatch(showNotice({ kind: 'success', text: editingId ? 'Symptom report updated successfully.' : 'Symptom report created successfully.' }));
    } finally {
      setSaving(false);
    }
  };

  const edit = async (item: any) => {
    setForm({ oncology_record_id: item.oncology_record_id || '', symptom_name: item.symptom_name || '', severity: item.severity || 'mild', onset_date: item.onset_date || '', progression: item.progression || 'stable', pain_score: item.pain_score ?? 0, notes: item.notes || '', reported_date: item.reported_date || '' });
    const record = item.oncology_record || (item.oncology_record_id ? (await oncologyApi.records.get(item.oncology_record_id)).data : null);
    setLinkedRecord(record);
    const patient = record?.patient || (record?.patient_id ? (await patientsApi.get(record.patient_id)).data : null);
    setSelectedPatient(patient);
    setEditingId(item.id);
    setOpen(true);
  };

  const remove = async (id: number) => {
    const ok = await confirm({ title: 'Delete symptom report', message: 'This symptom report will be deleted. Continue?', confirmText: 'Delete' });
    if (!ok) return;
    await withLoading(async () => {
      await oncologyApi.symptoms.delete(id);
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: 'Symptom report deleted successfully.' }));
    });
  };

  const quickState = async (id: number, payload: any) => {
    await oncologyApi.symptoms.setState(id, payload);
    await fetchData();
  };

  return (
    <div>
      <div className="page-header"><h2 className="page-title"><i className="fas fa-notes-medical"></i> Symptom Report</h2>{canCreateSymptom && <button className="btn btn-primary" onClick={() => setOpen(true)}>{open ? 'Close Form' : 'Add Symptom Report'}</button>}</div>
      <div className="module-intro-card symptom-card"><div><span className="eyebrow">Symptom Tracking</span><h3>Symptom Reports</h3><p>Record and monitor patient symptoms including severity, onset, progression, and pain levels for ongoing clinical review.</p></div><div className="metric-chip-row"><span className="metric-chip warning">Active symptoms</span><span className="metric-chip info">Post-treatment monitoring</span><span className="metric-chip danger">Urgent review</span></div></div>
      <div className="card" style={{ marginBottom: 16 }}><div className="form-grid"><div className="form-group"><label>Severity Filter</label><select value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}><option value="">All severities</option><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></div></div></div>
      <div className="result-count">{count} record(s)</div>
      <div className="card premium-table-card"><table className="table"><thead><tr><th>Patient</th><th>Oncology Context</th><th>Symptom</th><th>Severity</th><th>Progression</th><th>Onset</th><th>Reported</th><th>Pain</th><th>Actions</th></tr></thead><tbody>{items.map((item)=>{ const record = item.oncology_record; const patient = record?.patient; return <tr key={item.id}><td>{patient ? <Link to={`/patients/${patient.id}`}>{patient.first_name} {patient.last_name}</Link> : 'Patient not loaded'}</td><td>{record ? `${record.cancer_type} · ${record.clinical_stage || record.status || 'Active'}` : 'Oncology context unavailable'}</td><td><strong>{item.symptom_name}</strong></td><td>{item.severity}</td><td>{item.progression || '-'}</td><td>{item.onset_date || '-'}</td><td>{item.reported_date || '-'}</td><td>{item.pain_score ?? '-'}</td><td className="actions">{canEditSymptom && <button onClick={()=>edit(item)} className="btn btn-sm btn-warning">Edit</button>}{canManageSymptomActions && <button onClick={()=>quickState(item.id,{ severity:'severe', notes:'Escalated from symptom board' })} className="btn btn-sm">Escalate</button>}{canManageSymptomActions && <button onClick={()=>quickState(item.id,{ progression:'improving', notes:'Marked resolving from symptom board' })} className="btn btn-sm btn-primary">Mark Resolving</button>}{canDeleteSymptom && <button onClick={()=>remove(item.id)} className="btn btn-sm btn-danger">Delete</button>}</td></tr>})}{items.length===0 && <tr><td colSpan={9} className="text-center">No symptom reports yet</td></tr>}</tbody></table></div>
      <PaginationControls page={page} pageSize={pageSize} total={count} onPageChange={setPage} />
      <CrudModal open={open} title={editingId ? 'Edit Symptom Report' : 'Add Symptom Report'} onClose={resetForm}><form onSubmit={submit} className="form-grid"><div className="detail-field full-width"><label className="section-label">Symptom Report</label><p className="section-help">Capture symptom name, severity, onset, progression, pain score, and notes so the oncology care team can monitor risk and response over time.</p></div><PatientSearchPicker value={selectedPatient} onSelect={async (patient) => { setSelectedPatient(patient); setLinkedRecord(null); setForm({ ...form, oncology_record_id: '' }); if (patient) await resolveRecordForPatient(patient); }} label="Patient" required /><div className="detail-field"><label>Linked Oncology Record</label><span>{linkedRecord ? `${linkedRecord.cancer_type} · ${linkedRecord.clinical_stage || linkedRecord.status || 'Active'}` : 'No oncology record found yet'}</span></div><div className="form-group"><label>Symptom</label><input value={form.symptom_name} onChange={(e)=>setForm({...form, symptom_name:e.target.value})} required /></div><div className="form-group"><label>Severity</label><select value={form.severity} onChange={(e)=>setForm({...form, severity:e.target.value})}><option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option></select></div><div className="form-group"><label>Onset Date</label><DateInput value={form.onset_date} onChange={v=>setForm({...form, onset_date:v})} /></div><div className="form-group"><label>Reported Date</label><DateInput value={form.reported_date} onChange={v=>setForm({...form, reported_date:v})} /></div><div className="form-group"><label>Progression</label><select value={form.progression} onChange={(e)=>setForm({...form, progression:e.target.value})}><option value="stable">Stable</option><option value="improving">Improving</option><option value="progressing">Progressing</option><option value="worsening">Worsening</option></select></div><div className="form-group"><label>Pain Score</label><input type="number" min="0" max="10" value={form.pain_score} onChange={(e)=>setForm({...form, pain_score:e.target.value})} /></div><div className="form-group" style={{gridColumn:'1 / -1'}}><label>Notes</label><textarea value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} /></div><div className="form-actions" style={{gridColumn:'1 / -1'}}><button className="btn btn-primary" disabled={saving || !form.oncology_record_id}>{saving ? 'Saving...' : editingId ? 'Update Symptom Report' : 'Save Symptom Report'}</button></div></form></CrudModal>
    </div>
  );
}
