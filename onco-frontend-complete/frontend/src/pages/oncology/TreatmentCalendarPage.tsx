import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { oncologyApi } from '../../api';
import CrudModal from '../../components/CrudModal';

export default function TreatmentCalendarPage() {
  const [items, setItems] = useState<any[]>([]);
  const [responseFilter, setResponseFilter] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const res = await oncologyApi.treatments.list();
    const rows = Array.isArray(res.data) ? res.data : res.data.results || [];
    setItems(rows);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => items.filter((item) => !responseFilter || item.response === responseFilter), [items, responseFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of filtered) {
      const key = item.start_date || 'Unscheduled';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const totals = {
    scheduled: filtered.filter((item) => item.start_date).length,
    active: filtered.filter((item) => !item.end_date).length,
    completed: filtered.filter((item) => !!item.end_date).length,
    monitoring: filtered.filter((item) => item.response === 'monitoring').length,
  };

  const openReschedule = (item: any) => {
    setSelectedItem(item);
    setRescheduleDate(item.start_date || '');
    setRescheduleNotes('');
    setRescheduleOpen(true);
  };

  const closeReschedule = () => {
    setSelectedItem(null);
    setRescheduleDate('');
    setRescheduleNotes('');
    setRescheduleOpen(false);
  };

  const submitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !rescheduleDate) return;
    setSaving(true);
    try {
      await oncologyApi.treatments.reschedule(selectedItem.id, { start_date: rescheduleDate, notes: rescheduleNotes || 'Rescheduled from calendar board' });
      closeReschedule();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const completeItem = async (item: any) => {
    if (!window.confirm('Mark this treatment as completed?')) return;
    await oncologyApi.treatments.complete(item.id, { notes: 'Completed from calendar board' });
    fetchData();
  };

  const delayItem = async (item: any) => {
    await oncologyApi.treatments.delay(item.id, { notes: 'Delayed from calendar board' });
    fetchData();
  };

  const setReadiness = async (item: any, readiness_status: string) => {
    await oncologyApi.treatments.readiness(item.id, { readiness_status });
    fetchData();
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-calendar-days"></i> Chemo Schedule Board</h2>
        <Link className="btn btn-primary" to="/treatments">Manage Treatments</Link>
      </div>

      <div className="module-intro-card">
        <div>
          <span className="eyebrow">Schedule Overview</span>
          <h3>Treatment Calendar</h3>
          <p>View upcoming sessions by date. Reschedule, delay, or mark treatments complete directly from this board.</p>
        </div>
        <div className="metric-chip-row">
          <span className="metric-chip info">Scheduled: {totals.scheduled}</span>
          <span className="metric-chip success">Active: {totals.active}</span>
          <span className="metric-chip warning">Monitoring: {totals.monitoring}</span>
          <span className="metric-chip danger">Completed: {totals.completed}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-group">
          <label>Response filter</label>
          <select value={responseFilter} onChange={(e) => setResponseFilter(e.target.value)}>
            <option value="">All responses</option>
            <option value="monitoring">Monitoring</option>
            <option value="stable">Stable</option>
            <option value="improving">Improving</option>
            <option value="progressing">Progressing</option>
          </select>
        </div>
      </div>

      <div className="calendar-grid">
        {grouped.map(([date, rows]) => (
          <div key={date} className="calendar-card">
            <div className="calendar-date">{date === 'Unscheduled' ? date : new Date(date).toLocaleDateString()}</div>
            <div className="calendar-list">
              {rows.map((row) => {
                const record = row.oncology_record;
                const patient = record?.patient;
                return (
                  <div key={row.id} className="calendar-item">
                    <strong>{row.regimen_name || row.treatment_type}</strong>
                    <span>{patient ? `${patient.first_name} ${patient.last_name}` : 'Patient not linked'}</span>
                    <span>{record ? `${record.cancer_type} · ${record.clinical_stage || record.status || 'Active'}` : 'Oncology context unavailable'}</span>
                    <span className={`badge ${row.response === 'improving' || row.response === 'stable' ? 'badge-success' : row.response === 'progressing' ? 'badge-danger' : 'badge-warning'}`}>{row.response || 'monitoring'}</span>
                    <span className="badge badge-info">{row.readiness_status || 'ready'}</span>
                    <span className="field-help">{row.end_date ? `Completed ${row.end_date}` : `Scheduled ${row.start_date}`}</span>
                    <div className="actions">
                      <button className="btn btn-sm btn-info" onClick={() => openReschedule(row)}>Reschedule</button>
                      <button className="btn btn-sm" onClick={() => delayItem(row)}>Delay</button>
                      <button className="btn btn-sm" onClick={() => setReadiness(row, 'labs_pending')}>Labs Pending</button>
                      <button className="btn btn-sm" onClick={() => setReadiness(row, 'auth_pending')}>Auth Pending</button>
                      <button className="btn btn-sm" onClick={() => setReadiness(row, 'patient_confirmed')}>Patient Confirmed</button>
                      <button className="btn btn-sm btn-primary" onClick={() => completeItem(row)}>Complete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {grouped.length === 0 && <div className="card">No scheduled treatments yet.</div>}
      </div>

      <CrudModal open={rescheduleOpen} title="Reschedule Treatment" onClose={closeReschedule}>
        <form onSubmit={submitReschedule} className="form-grid">
          <div className="form-group"><label>New treatment date</label><input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} required /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={rescheduleNotes} onChange={(e) => setRescheduleNotes(e.target.value)} placeholder="Reason for reschedule" /></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Reschedule'}</button></div>
        </form>
      </CrudModal>
    </div>
  );
}
