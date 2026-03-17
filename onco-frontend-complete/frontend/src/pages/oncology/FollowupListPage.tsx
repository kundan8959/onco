import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { oncologyApi, patientsApi } from '../../api';
import CrudModal from '../../components/CrudModal';
import PaginationControls from '../../components/PaginationControls';
import PatientSearchPicker from '../../components/PatientSearchPicker';
import { useConfirm } from '../../hooks/useConfirm';
import { useLoading } from '../../hooks/useLoading';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';
import { usePermissions } from '../../hooks/usePermissions';
import DateInput from '../../components/DateInput';

const emptyForm = {
  oncology_record_id: '',
  followup_date: '',
  recurrence_detected: false,
  imaging_summary: '',
  tumor_marker_summary: '',
  notes: '',
};

export default function FollowupListPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [recurrenceFilter, setRecurrenceFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [linkedRecord, setLinkedRecord] = useState<any>(null);
  const { confirm } = useConfirm();
  const { withLoading } = useLoading();
  const dispatch = useAppDispatch();
  const { canCreateFollowup, canEditFollowup, canDeleteFollowup } = usePermissions();
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    const params: any = { page, page_size: pageSize };
    if (recurrenceFilter === 'yes') params.recurrence_detected = true;
    if (recurrenceFilter === 'no') params.recurrence_detected = false;
    const res = await oncologyApi.followups.list(params);
    setItems(res.data.results || []);
    setCount(res.data.count || 0);
  }, [page, recurrenceFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resolveRecordForPatient = async (patient: any) => {
    const res = await oncologyApi.records.list({ patient_id: patient.id, page_size: 1 });
    const record = (res.data.results || res.data || [])[0] || null;
    setLinkedRecord(record);
    setForm((prev: any) => ({ ...prev, oncology_record_id: record?.id || '' }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedPatient(null);
    setLinkedRecord(null);
    setEditingId(null);
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        oncology_record_id: Number(form.oncology_record_id),
        recurrence_detected: !!form.recurrence_detected,
      };
      if (editingId) await oncologyApi.followups.update(editingId, payload);
      else await oncologyApi.followups.create(payload);
      resetForm();
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: editingId ? 'Follow-up updated successfully.' : 'Follow-up created successfully.' }));
    } finally {
      setSaving(false);
    }
  };

  const editItem = async (item: any) => {
    setForm({
      oncology_record_id: item.oncology_record_id || '',
      followup_date: item.followup_date || '',
      recurrence_detected: !!item.recurrence_detected,
      imaging_summary: item.imaging_summary || '',
      tumor_marker_summary: item.tumor_marker_summary || '',
      notes: item.notes || '',
    });
    const record = item.oncology_record || (item.oncology_record_id ? (await oncologyApi.records.get(item.oncology_record_id)).data : null);
    setLinkedRecord(record);
    const patient = record?.patient || (record?.patient_id ? (await patientsApi.get(record.patient_id)).data : null);
    setSelectedPatient(patient);
    setEditingId(item.id);
    setOpen(true);
  };

  const removeItem = async (id: number) => {
    const ok = await confirm({ title: 'Delete follow-up', message: 'This follow-up entry will be deleted. Continue?', confirmText: 'Delete' });
    if (!ok) return;
    await withLoading(async () => {
      await oncologyApi.followups.delete(id);
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: 'Follow-up deleted successfully.' }));
    });
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-stethoscope"></i> Follow-ups</h2>
        {canCreateFollowup && <button className="btn btn-primary" onClick={() => setOpen(true)}>Add Follow-up</button>}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Recurrence Filter</label>
            <select value={recurrenceFilter} onChange={(e) => { setRecurrenceFilter(e.target.value); setPage(1); }}>
              <option value="">All follow-ups</option>
              <option value="yes">Recurrence detected</option>
              <option value="no">No recurrence</option>
            </select>
          </div>
        </div>
      </div>

      <div className="result-count">{count} record(s)</div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Oncology Context</th>
              <th>Follow-up Date</th>
              <th>Recurrence</th>
              <th>Imaging Summary</th>
              <th>Tumor Markers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const record = item.oncology_record;
              const patient = record?.patient;
              return (
                <tr key={item.id}>
                  <td>{patient ? <Link to={`/patients/${patient.id}`}>{patient.first_name} {patient.last_name}</Link> : 'Patient not loaded'}</td>
                  <td>{record ? `${record.cancer_type} · ${record.clinical_stage || record.status || 'Active'}` : 'Oncology context unavailable'}</td>
                  <td>{item.followup_date || '-'}</td>
                  <td><span className={`badge ${item.recurrence_detected ? 'badge-danger' : 'badge-success'}`}>{item.recurrence_detected ? 'RECURRENCE' : 'STABLE'}</span></td>
                  <td>{item.imaging_summary || '-'}</td>
                  <td>{item.tumor_marker_summary || '-'}</td>
                  <td className="actions">
                    {canEditFollowup && <button className="btn btn-sm btn-warning" onClick={() => editItem(item)}>Edit</button>}
                    {canDeleteFollowup && <button className="btn btn-sm btn-danger" onClick={() => removeItem(item.id)}>Delete</button>}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={7} className="text-center">No follow-ups yet</td></tr>}
          </tbody>
        </table>
      </div>

      <PaginationControls page={page} pageSize={pageSize} total={count} onPageChange={setPage} />

      <CrudModal open={open} title={editingId ? 'Edit Follow-up' : 'Add Follow-up'} onClose={resetForm}>
        <form onSubmit={submit} className="form-grid">
          <PatientSearchPicker
            value={selectedPatient}
            onSelect={async (patient) => {
              setSelectedPatient(patient);
              setLinkedRecord(null);
              setForm({ ...form, oncology_record_id: '' });
              if (patient) await resolveRecordForPatient(patient);
            }}
            label="Patient"
            required
          />
          <div className="detail-field">
            <label>Linked Oncology Record</label>
            <span>{linkedRecord ? `${linkedRecord.cancer_type} · ${linkedRecord.clinical_stage || linkedRecord.status || 'Active'}` : 'No oncology record found yet'}</span>
          </div>
          <div className="form-group"><label>Follow-up Date</label><DateInput value={form.followup_date} onChange={v => setForm({ ...form, followup_date: v })} required /></div>
          <div className="form-group checkbox-group"><label><input type="checkbox" checked={form.recurrence_detected} onChange={(e) => setForm({ ...form, recurrence_detected: e.target.checked })} /> Recurrence detected</label></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Imaging Summary</label><textarea value={form.imaging_summary} onChange={(e) => setForm({ ...form, imaging_summary: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Tumor Marker Summary</label><textarea value={form.tumor_marker_summary} onChange={(e) => setForm({ ...form, tumor_marker_summary: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" disabled={saving || !form.oncology_record_id}>{saving ? 'Saving...' : editingId ? 'Update Follow-up' : 'Save Follow-up'}</button>
          </div>
        </form>
      </CrudModal>
    </div>
  );
}
