import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { oncologyApi, patientsApi } from '../../api';
import CrudModal from '../../components/CrudModal';
import PatientSearchPicker from '../../components/PatientSearchPicker';
import PaginationControls from '../../components/PaginationControls';

const emptyForm = {
  oncology_record_id: '',
  treatment_type: 'chemotherapy',
  regimen_name: '',
  start_date: '',
  end_date: '',
  response: 'monitoring',
  notes: '',
};

export default function TreatmentListPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [form, setForm] = useState<any>(emptyForm);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [linkedRecord, setLinkedRecord] = useState<any>(null);
  const [responseFilter, setResponseFilter] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    const res = await oncologyApi.treatments.list({ page, page_size: pageSize, ...(responseFilter ? { response: responseFilter } : {}) });
    setItems(res.data.results || []);
    setCount(res.data.count || 0);
  }, [page, responseFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resolveRecordForPatient = async (patient: any) => {
    const oncologyRes = await oncologyApi.records.list({ patient_id: patient.id, page_size: 1 });
    const record = (oncologyRes.data.results || oncologyRes.data || [])[0] || null;
    setLinkedRecord(record);
    setForm((prev: any) => ({ ...prev, oncology_record_id: record?.id || '' }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
    setSelectedPatient(null);
    setLinkedRecord(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, oncology_record_id: Number(form.oncology_record_id) };
      if (editingId) await oncologyApi.treatments.update(editingId, payload);
      else await oncologyApi.treatments.create(payload);
      resetForm();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const edit = async (item: any) => {
    setForm({
      oncology_record_id: item.oncology_record_id || '',
      treatment_type: item.treatment_type || 'chemotherapy',
      regimen_name: item.regimen_name || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      response: item.response || 'monitoring',
      notes: item.notes || '',
    });
    const record = item.oncology_record || (item.oncology_record_id ? (await oncologyApi.records.get(item.oncology_record_id)).data : null);
    setLinkedRecord(record);
    const patient = record?.patient || (record?.patient_id ? (await patientsApi.get(record.patient_id)).data : null);
    setSelectedPatient(patient);
    setEditingId(item.id);
    setOpen(true);
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this treatment?')) return;
    await oncologyApi.treatments.delete(id);
    fetchData();
  };

  const openReschedule = (item: any) => {
    setRescheduleItem(item);
    setRescheduleDate(item.start_date || '');
    setRescheduleNotes('');
    setRescheduleOpen(true);
  };

  const closeReschedule = () => {
    setRescheduleItem(null);
    setRescheduleDate('');
    setRescheduleNotes('');
    setRescheduleOpen(false);
  };

  const submitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleItem || !rescheduleDate) return;
    await oncologyApi.treatments.reschedule(rescheduleItem.id, { start_date: rescheduleDate, notes: rescheduleNotes || 'Rescheduled from treatment board' });
    closeReschedule();
    fetchData();
  };

  const complete = async (item: any) => {
    if (!window.confirm('Mark this treatment as completed?')) return;
    await oncologyApi.treatments.complete(item.id, { notes: 'Completed from treatment board' });
    fetchData();
  };

  const delay = async (item: any) => {
    await oncologyApi.treatments.delay(item.id, { notes: 'Delayed from treatment board' });
    fetchData();
  };

  const setReadiness = async (item: any, readiness_status: string) => {
    await oncologyApi.treatments.readiness(item.id, { readiness_status });
    fetchData();
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-syringe"></i> Treatments & Chemo Schedule</h2>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>{open ? 'Close Form' : 'Add Treatment'}</button>
      </div>

      <div className="module-intro-card">
        <div>
          <span className="eyebrow">Chemo operations</span>
          <h3>Select patients by name, email, phone, or MRN — not by internal IDs.</h3>
          <p>Now with explicit treatment actions and a proper reschedule modal instead of browser prompts like some haunted admin panel.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Response Filter</label>
            <select value={responseFilter} onChange={(e) => { setResponseFilter(e.target.value); setPage(1); }}>
              <option value="">All responses</option>
              <option value="monitoring">Monitoring</option>
              <option value="stable">Stable</option>
              <option value="improving">Improving</option>
              <option value="progressing">Progressing</option>
            </select>
          </div>
        </div>
      </div>

      <div className="result-count">{count} record(s)</div>
      <div className="card premium-table-card">
        <table className="table">
          <thead><tr><th>Patient</th><th>Cancer Context</th><th>Type</th><th>Regimen</th><th>Start</th><th>End</th><th>Response</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((item) => {
              const record = item.oncology_record;
              const patient = record?.patient;
              return (
                <tr key={item.id}>
                  <td>{patient ? <Link to={`/patients/${patient.id}`}>{patient.first_name} {patient.last_name}</Link> : 'Patient not loaded'}</td>
                  <td>{record ? `${record.cancer_type} · ${record.clinical_stage || record.status || 'Active'}` : 'Oncology context unavailable'}</td>
                  <td>{item.treatment_type}</td>
                  <td>{item.regimen_name || '-'}</td>
                  <td>{item.start_date || '-'}</td>
                  <td>{item.end_date || '-'}</td>
                  <td><span className={`badge ${item.response === 'improving' || item.response === 'stable' ? 'badge-success' : item.response === 'progressing' ? 'badge-danger' : 'badge-warning'}`}>{item.response || '-'}</span><div className="field-help">{item.readiness_status || 'ready'}</div></td>
                  <td className="actions"><button onClick={() => edit(item)} className="btn btn-sm btn-warning">Edit</button><button onClick={() => openReschedule(item)} className="btn btn-sm btn-info">Reschedule</button><button onClick={() => delay(item)} className="btn btn-sm">Delay</button><button onClick={() => setReadiness(item, 'labs_pending')} className="btn btn-sm">Labs Pending</button><button onClick={() => setReadiness(item, 'auth_pending')} className="btn btn-sm">Auth Pending</button><button onClick={() => setReadiness(item, 'patient_confirmed')} className="btn btn-sm">Patient Confirmed</button><button onClick={() => complete(item)} className="btn btn-sm btn-primary">Complete</button><button onClick={() => remove(item.id)} className="btn btn-sm btn-danger">Delete</button></td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={8} className="text-center">No treatments yet</td></tr>}
          </tbody>
        </table>
      </div>

      <PaginationControls page={page} pageSize={pageSize} total={count} onPageChange={setPage} />

      <CrudModal open={open} title={editingId ? 'Edit Treatment' : 'Add Treatment'} onClose={resetForm}>
        <form onSubmit={submit} className="form-grid">
          <div className="detail-field full-width">
            <label className="section-label">Patient selector</label>
            <p className="section-help">Search by patient name, email, phone, or medical record number. Selecting a patient auto-links the related oncology record.</p>
          </div>
          <PatientSearchPicker value={selectedPatient} onSelect={async (patient) => { setSelectedPatient(patient); setLinkedRecord(null); setForm({ ...form, oncology_record_id: '' }); if (patient) await resolveRecordForPatient(patient); }} required />
          <div className="detail-field"><label>Linked Oncology Record</label><span>{linkedRecord ? `${linkedRecord.cancer_type} · ${linkedRecord.clinical_stage || linkedRecord.status || 'Active'}` : 'No oncology record found'}</span></div>
          <div className="form-group"><label>Type</label><select value={form.treatment_type} onChange={(e) => setForm({ ...form, treatment_type: e.target.value })}><option value="chemotherapy">Chemotherapy</option><option value="radiation">Radiation</option><option value="surgery">Surgery</option><option value="targeted_therapy">Targeted Therapy</option></select></div>
          <div className="form-group"><label>Regimen</label><input value={form.regimen_name} onChange={(e) => setForm({ ...form, regimen_name: e.target.value })} /></div>
          <div className="form-group"><label>Start Date</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div>
          <div className="form-group"><label>End Date</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
          <div className="form-group"><label>Response</label><select value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })}><option value="monitoring">Monitoring</option><option value="stable">Stable</option><option value="improving">Improving</option><option value="progressing">Progressing</option></select></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" disabled={saving || !form.oncology_record_id}>{saving ? 'Saving...' : editingId ? 'Update Treatment' : 'Save Treatment & Notify Patient'}</button></div>
        </form>
      </CrudModal>

      <CrudModal open={rescheduleOpen} title="Reschedule Treatment" onClose={closeReschedule}>
        <form onSubmit={submitReschedule} className="form-grid">
          <div className="form-group"><label>New start date</label><input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} required /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={rescheduleNotes} onChange={(e) => setRescheduleNotes(e.target.value)} placeholder="Why is this being rescheduled?" /></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary">Save Reschedule</button></div>
        </form>
      </CrudModal>
    </div>
  );
}
