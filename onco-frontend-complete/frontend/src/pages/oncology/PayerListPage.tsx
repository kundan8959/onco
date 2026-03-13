import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { oncologyApi, patientsApi } from '../../api';
import CrudModal from '../../components/CrudModal';
import PatientSearchPicker from '../../components/PatientSearchPicker';
import PaginationControls from '../../components/PaginationControls';
import { useConfirm } from '../../hooks/useConfirm';
import { useLoading } from '../../hooks/useLoading';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';
import { usePermissions } from '../../hooks/usePermissions';

const emptyForm = { oncology_record_id: '', insurance_company: '', policy_number: '', primary_or_secondary: 'primary', icd10_diagnosis_code: 'C80.1', claim_type: 'chemotherapy', claim_status: 'submitted', authorization_status: 'not_required', submission_date: '', billed_amount: '', approved_amount: '' };

export default function PayerListPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [linkedRecord, setLinkedRecord] = useState<any>(null);
  const [claimFilter, setClaimFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();
  const { withLoading } = useLoading();
  const dispatch = useAppDispatch();
  const { canCreatePayer, canEditPayer, canDeletePayer, canManagePayerActions } = usePermissions();
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    const res = await oncologyApi.payer.list({ page, page_size: pageSize, ...(claimFilter ? { claim_status: claimFilter } : {}) });
    setItems(res.data.results || []);
    setCount(res.data.count || 0);
  }, [page, claimFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resolveRecordForPatient = async (patient: any) => {
    const res = await oncologyApi.records.list({ patient_id: patient.id, page_size: 1 });
    const record = (res.data.results || res.data || [])[0] || null;
    setLinkedRecord(record);
    setForm((prev: any) => ({ ...prev, oncology_record_id: record?.id || '' }));
  };

  const resetForm = () => { setForm(emptyForm); setSelectedPatient(null); setLinkedRecord(null); setEditingId(null); setOpen(false); };

  const handleDelete = async (id: number) => {
    const ok = await confirm({ title: 'Delete payer submission', message: 'This payer submission will be deleted. Continue?', confirmText: 'Delete' });
    if (!ok) return;
    await withLoading(async () => {
      await oncologyApi.payer.delete(id);
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: 'Payer submission deleted successfully.' }));
    });
  };

  const handleEdit = async (item: any) => {
    setForm({ oncology_record_id: item.oncology_record_id || '', insurance_company: item.insurance_company || '', policy_number: item.policy_number || '', primary_or_secondary: item.primary_or_secondary || 'primary', icd10_diagnosis_code: item.icd10_diagnosis_code || 'C80.1', claim_type: item.claim_type || 'chemotherapy', claim_status: item.claim_status || 'submitted', authorization_status: item.authorization_status || 'not_required', submission_date: item.submission_date || '', billed_amount: item.billed_amount || '', approved_amount: item.approved_amount || '' });
    const record = item.oncology_record || (item.oncology_record_id ? (await oncologyApi.records.get(item.oncology_record_id)).data : null);
    setLinkedRecord(record);
    const patient = record?.patient || (record?.patient_id ? (await patientsApi.get(record.patient_id)).data : null);
    setSelectedPatient(patient);
    setEditingId(item.id); setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, oncology_record_id: Number(form.oncology_record_id), cpt_codes: [], hcpcs_codes: [], billed_amount: form.billed_amount ? Number(form.billed_amount) : null, approved_amount: form.approved_amount ? Number(form.approved_amount) : null };
      if (editingId) await oncologyApi.payer.update(editingId, payload); else await oncologyApi.payer.create(payload);
      resetForm(); fetchData();
      dispatch(showNotice({ kind: 'success', text: editingId ? 'Payer submission updated successfully.' : 'Payer submission created successfully.' }));
    } finally { setSaving(false); }
  };

  const statusColor = (s: string) => ({ pending:'#f6c23e', submitted:'#4e73df', approved:'#1cc88a', denied:'#e74a3b', appealed:'#fd7e14', paid:'#1cc88a', rejected:'#e74a3b' } as any)[s] || '#858796';
  const quickStatus = async (id: number, claim_status: string) => {
    await oncologyApi.payer.setStatus(id, { claim_status });
    fetchData();
  };

  return (
    <div>
      <div className="page-header"><h2 className="page-title"><i className="fas fa-file-invoice-dollar"></i> Payer Submission</h2>{canCreatePayer && <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fas fa-plus"></i> New Claim / Auth Request</button>}</div>
      <div className="module-intro-card revenue-card"><div><span className="eyebrow">Billing & Insurance</span><h3>Payer Submissions</h3><p>Submit and track insurance claims, prior authorization requests, and reimbursement status for oncology treatments.</p></div><div className="metric-chip-row"><span className="metric-chip success">Approved claims</span><span className="metric-chip info">Submitted</span><span className="metric-chip warning">Authorization pending</span></div></div>
      <div className="card" style={{ marginBottom: 16 }}><div className="form-grid"><div className="form-group"><label>Claim Status Filter</label><select value={claimFilter} onChange={(e) => { setClaimFilter(e.target.value); setPage(1); }}><option value="">All claim states</option><option value="pending">Pending</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="denied">Denied</option><option value="paid">Paid</option></select></div></div></div>
      <div className="result-count">{count} record(s)</div>
      <div className="card premium-table-card"><table className="table"><thead><tr><th>Patient</th><th>Oncology Context</th><th>Payer</th><th>Policy Number</th><th>ICD-10</th><th>Claim Status</th><th>Authorization</th><th>Submission Date</th><th>Financials</th><th>Actions</th></tr></thead><tbody>{items.map((p:any)=>{ const record = p.oncology_record; const patient = record?.patient; return <tr key={p.id}><td>{patient ? <Link to={`/patients/${patient.id}`}>{patient.first_name} {patient.last_name}</Link> : 'Patient not loaded'}</td><td>{record ? `${record.cancer_type} · ${record.clinical_stage || record.status || 'Active'}` : 'Oncology context unavailable'}</td><td><strong>{p.insurance_company || '-'}</strong></td><td>{p.policy_number || '-'}</td><td>{p.icd10_diagnosis_code || '-'}</td><td><span className="badge" style={{backgroundColor: statusColor(p.claim_status)}}>{p.claim_status?.toUpperCase() || '-'}</span></td><td>{p.authorization_status || '-'}</td><td>{p.submission_date || '-'}</td><td><div className="financial-stack"><span>Billed: {p.billed_amount ? `$${Number(p.billed_amount).toLocaleString()}` : '-'}</span><span>Approved: {p.approved_amount ? `$${Number(p.approved_amount).toLocaleString()}` : '-'}</span></div></td><td className="actions">{canEditPayer && <button onClick={()=>handleEdit(p)} className="btn btn-sm btn-warning"><i className="fas fa-edit"></i></button>}{canManagePayerActions && <button onClick={()=>quickStatus(p.id,'approved')} className="btn btn-sm btn-primary">Approve</button>}{canManagePayerActions && <button onClick={()=>quickStatus(p.id,'denied')} className="btn btn-sm">Deny</button>}{canDeletePayer && <button onClick={()=>handleDelete(p.id)} className="btn btn-sm btn-danger"><i className="fas fa-trash"></i></button>}</td></tr>})}{items.length===0 && <tr><td colSpan={10} className="text-center">No payer submissions</td></tr>}</tbody></table></div>
      <PaginationControls page={page} pageSize={pageSize} total={count} onPageChange={setPage} />
      <CrudModal open={open} title={editingId ? 'Edit Payer Submission' : 'Create Payer Submission'} onClose={resetForm}><form onSubmit={submit} className="form-grid"><div className="detail-field full-width"><label className="section-label">Payer Submission</label><p className="section-help">Capture the insurance entity, diagnosis coding, claim state, authorization state, and financial request. This mirrors the provider → payer workflow used in US healthcare billing.</p></div><PatientSearchPicker value={selectedPatient} onSelect={async (patient) => { setSelectedPatient(patient); setLinkedRecord(null); setForm({ ...form, oncology_record_id: '' }); if (patient) await resolveRecordForPatient(patient); }} label="Patient" required /><div className="detail-field"><label>Linked Oncology Record</label><span>{linkedRecord ? `${linkedRecord.cancer_type} · ${linkedRecord.clinical_stage || linkedRecord.status || 'Active'}` : 'No oncology record found yet'}</span></div><div className="form-group"><label>Insurance Company / Payer</label><input value={form.insurance_company} onChange={(e)=>setForm({...form, insurance_company:e.target.value})} required /></div><div className="form-group"><label>Policy Number</label><input value={form.policy_number} onChange={(e)=>setForm({...form, policy_number:e.target.value})} required /></div><div className="form-group"><label>Primary / Secondary</label><select value={form.primary_or_secondary} onChange={(e)=>setForm({...form, primary_or_secondary:e.target.value})}><option value="primary">Primary</option><option value="secondary">Secondary</option></select></div><div className="form-group"><label>ICD-10 Diagnosis Code</label><input value={form.icd10_diagnosis_code} onChange={(e)=>setForm({...form, icd10_diagnosis_code:e.target.value})} required /></div><div className="form-group"><label>Claim Type</label><input value={form.claim_type} onChange={(e)=>setForm({...form, claim_type:e.target.value})} placeholder="Claim / Prior auth / Secondary claim" /></div><div className="form-group"><label>Claim Status</label><select value={form.claim_status} onChange={(e)=>setForm({...form, claim_status:e.target.value})}><option value="pending">Pending</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="denied">Denied</option><option value="paid">Paid</option></select></div><div className="form-group"><label>Authorization Status</label><select value={form.authorization_status} onChange={(e)=>setForm({...form, authorization_status:e.target.value})}><option value="not_required">Not required</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="denied">Denied</option></select></div><div className="form-group"><label>Submission Date</label><input type="date" value={form.submission_date} onChange={(e)=>setForm({...form, submission_date:e.target.value})} /></div><div className="form-group"><label>Billed Amount</label><input type="number" step="0.01" value={form.billed_amount} onChange={(e)=>setForm({...form, billed_amount:e.target.value})} /></div><div className="form-group"><label>Approved Amount</label><input type="number" step="0.01" value={form.approved_amount} onChange={(e)=>setForm({...form, approved_amount:e.target.value})} /></div><div className="form-actions" style={{gridColumn:'1 / -1'}}><button className="btn btn-primary" disabled={saving || !form.oncology_record_id}>{saving ? 'Saving...' : editingId ? 'Update Payer Submission' : 'Create Payer Submission'}</button></div></form></CrudModal>
    </div>
  );
}
