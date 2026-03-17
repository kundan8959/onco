import { useCallback, useEffect, useMemo, useState } from 'react';
import { episodesApi, oncologyApi } from '../../api';
import CrudModal from '../../components/CrudModal';
import Loader from '../../components/Loader';
import { usePermissions } from '../../hooks/usePermissions';
import DateInput from '../../components/DateInput';

const EPISODE_TYPES = [
  { value: 'chemotherapy', label: 'Chemotherapy' },
  { value: 'radiation', label: 'Radiation Therapy' },
  { value: 'immunotherapy', label: 'Immunotherapy' },
  { value: 'targeted_therapy', label: 'Targeted Therapy' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'follow_up', label: 'Follow-up Visit' },
];

const EPISODE_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: '#4e73df', bg: '#edf2ff' },
  { value: 'confirmed', label: 'Confirmed', color: '#1cc88a', bg: '#e6fff5' },
  { value: 'in_progress', label: 'In Progress', color: '#fd7e14', bg: '#fff3e0' },
  { value: 'completed', label: 'Completed', color: '#858796', bg: '#f0f0f0' },
  { value: 'cancelled', label: 'Cancelled', color: '#e74a3b', bg: '#fde8e8' },
  { value: 'missed', label: 'Missed', color: '#d63031', bg: '#ffe8e8' },
  { value: 'postponed', label: 'Postponed', color: '#f6c23e', bg: '#fffbe6' },
];

const CANCER_TYPES = ['Breast Cancer', 'Prostate Cancer', 'Lung Cancer', 'Colorectal Cancer'];

const CANCER_COLORS: Record<string, string> = {
  'Breast Cancer': '#e91e8c',
  'Prostate Cancer': '#1b5e9c',
  'Lung Cancer': '#2962a8',
  'Colorectal Cancer': '#2e7d32',
};

const PRE_REQUIREMENT_SUGGESTIONS = [
  'CBC labs required 24 hours before appointment',
  'Comprehensive metabolic panel required',
  'Fasting from midnight before appointment',
  'Hydrate well the day before — drink at least 2 litres of water',
  'Bring current medication list',
  'No NSAIDs or blood thinners for 48 hours before',
  'Wear loose, comfortable clothing',
  'Arrive 30 minutes early for pre-appointment labs',
];

const emptyForm = () => ({
  oncology_record_id: '',
  patient_id: '',
  episode_type: '',
  cancer_type: '',
  scheduled_date: '',
  scheduled_time: '',
  duration_minutes: '',
  location: '',
  cycle_number: '',
  session_number: '',
  total_sessions: '',
  pre_requirements: '',
  attending_staff: '',
  notes: '',
});

type TabKey = 'all' | 'today' | 'upcoming' | 'completed' | 'cancelled';

function statusMeta(status: string) {
  return EPISODE_STATUSES.find((s) => s.value === status) || { label: status, color: '#858796', bg: '#f0f0f0' };
}

function episodeTypeLabel(type: string) {
  return EPISODE_TYPES.find((t) => t.value === type)?.label || type;
}

export default function EpisodeSchedulePage() {
  const { canCreateTreatment, canEditTreatment, canDeleteTreatment } = usePermissions();

  const [episodes, setEpisodes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Filters
  const [filterCancer, setFilterCancer] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [tab, setTab] = useState<TabKey>('all');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');

  // Record search for create modal
  const [recordSearch, setRecordSearch] = useState('');
  const [recordResults, setRecordResults] = useState<any[]>([]);
  const [recordLoading, setRecordLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Cancel modal
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Reminder confirmation
  const [reminderSent, setReminderSent] = useState<number | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const fetchEpisodes = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page_size: 200 };
      if (filterCancer) params.cancer_type = filterCancer;
      if (filterType) params.episode_type = filterType;
      if (filterStatus) params.status = filterStatus;
      const res = await episodesApi.list(params);
      let rows: any[] = res.data.results || res.data || [];

      // Date range filter (client-side since backend doesn't have date range filter)
      if (filterDateFrom) rows = rows.filter((r) => r.scheduled_date >= filterDateFrom);
      if (filterDateTo) rows = rows.filter((r) => r.scheduled_date <= filterDateTo);

      setEpisodes(rows);
      setTotal(res.data.count || rows.length);
    } finally {
      setLoading(false);
    }
  }, [filterCancer, filterType, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchEpisodes(); }, [fetchEpisodes]);

  // Apply tab filter
  const visibleEpisodes = useMemo(() => {
    const in7d = new Date(); in7d.setDate(in7d.getDate() + 7);
    const in7dStr = in7d.toISOString().slice(0, 10);
    switch (tab) {
      case 'today': return episodes.filter((e) => e.scheduled_date === today);
      case 'upcoming': return episodes.filter((e) => e.scheduled_date > today && e.scheduled_date <= in7dStr && !['completed', 'cancelled', 'missed'].includes(e.status));
      case 'completed': return episodes.filter((e) => e.status === 'completed');
      case 'cancelled': return episodes.filter((e) => e.status === 'cancelled' || e.status === 'missed');
      default: return episodes;
    }
  }, [episodes, tab, today]);

  // Stats
  const stats = useMemo(() => ({
    total: episodes.length,
    today: episodes.filter((e) => e.scheduled_date === today).length,
    upcoming: episodes.filter((e) => e.scheduled_date > today && !['completed', 'cancelled', 'missed'].includes(e.status)).length,
    completed: episodes.filter((e) => e.status === 'completed').length,
  }), [episodes, today]);

  // Record search for form
  useEffect(() => {
    if (!recordSearch || recordSearch.length < 2) { setRecordResults([]); return; }
    setRecordLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await oncologyApi.records.list({ search: recordSearch, page_size: 10 });
        setRecordResults(res.data.results || res.data || []);
      } finally {
        setRecordLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [recordSearch]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setFormError('');
    setSelectedRecord(null);
    setRecordSearch('');
    setRecordResults([]);
    setShowModal(true);
  };

  const openEdit = (ep: any) => {
    setEditId(ep.id);
    setSelectedRecord(ep.oncology_record);
    setForm({
      oncology_record_id: String(ep.oncology_record_id || ''),
      patient_id: String(ep.patient_id || ''),
      episode_type: ep.episode_type || '',
      cancer_type: ep.cancer_type || '',
      scheduled_date: ep.scheduled_date || '',
      scheduled_time: ep.scheduled_time || '',
      duration_minutes: String(ep.duration_minutes || ''),
      location: ep.location || '',
      cycle_number: String(ep.cycle_number || ''),
      session_number: String(ep.session_number || ''),
      total_sessions: String(ep.total_sessions || ''),
      pre_requirements: ep.pre_requirements || '',
      attending_staff: ep.attending_staff || '',
      notes: ep.notes || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const selectRecord = (rec: any) => {
    setSelectedRecord(rec);
    setForm((f) => ({
      ...f,
      oncology_record_id: String(rec.id),
      patient_id: String(rec.patient_id || rec.patient?.id || ''),
      cancer_type: rec.cancer_type || '',
    }));
    setRecordSearch(rec.patient_name || `Record #${rec.id}`);
    setRecordResults([]);
  };

  const handleSave = async () => {
    if (!form.oncology_record_id || !form.patient_id) { setFormError('Please select a patient / oncology record.'); return; }
    if (!form.episode_type) { setFormError('Episode type is required.'); return; }
    if (!form.scheduled_date) { setFormError('Scheduled date is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload: any = {
        oncology_record_id: Number(form.oncology_record_id),
        patient_id: Number(form.patient_id),
        episode_type: form.episode_type,
        cancer_type: form.cancer_type || undefined,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time || undefined,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        location: form.location || undefined,
        cycle_number: form.cycle_number ? Number(form.cycle_number) : undefined,
        session_number: form.session_number ? Number(form.session_number) : undefined,
        total_sessions: form.total_sessions ? Number(form.total_sessions) : undefined,
        pre_requirements: form.pre_requirements || undefined,
        attending_staff: form.attending_staff || undefined,
        notes: form.notes || undefined,
      };
      if (editId) {
        await episodesApi.update(editId, payload);
      } else {
        await episodesApi.create(payload);
      }
      setShowModal(false);
      fetchEpisodes();
    } catch (e: any) {
      setFormError(e?.response?.data?.message || 'Failed to save episode. Please check all fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action: 'confirm' | 'complete' | 'delete', ep: any) => {
    setActionLoading(ep.id);
    try {
      if (action === 'confirm') await episodesApi.confirm(ep.id);
      else if (action === 'complete') await episodesApi.complete(ep.id);
      else if (action === 'delete') { if (!window.confirm('Delete this episode?')) return; await episodesApi.delete(ep.id); }
      fetchEpisodes();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelId) return;
    setActionLoading(cancelId);
    try {
      await episodesApi.cancel(cancelId, cancelReason);
      setCancelId(null);
      setCancelReason('');
      fetchEpisodes();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReminder = async (ep: any) => {
    setActionLoading(ep.id);
    try {
      await episodesApi.sendReminder(ep.id);
      setReminderSent(ep.id);
      setTimeout(() => setReminderSent(null), 3000);
      fetchEpisodes();
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'today', label: "Today", count: stats.today },
    { key: 'upcoming', label: 'Upcoming 7 days', count: stats.upcoming },
    { key: 'completed', label: 'Completed', count: stats.completed },
    { key: 'cancelled', label: 'Cancelled/Missed' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title"><i className="fas fa-calendar-check"></i> Episode Schedule</h2>
          <p className="page-subtitle">Manage chemotherapy, radiation, and treatment episodes. Send reminders and track progress.</p>
        </div>
        {canCreateTreatment && (
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="fas fa-plus"></i> Schedule Episode
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Episodes', value: stats.total, icon: 'fa-calendar-alt', color: '#4e73df' },
          { label: 'Today', value: stats.today, icon: 'fa-calendar-day', color: '#fd7e14' },
          { label: 'Upcoming', value: stats.upcoming, icon: 'fa-calendar-plus', color: '#1cc88a' },
          { label: 'Completed', value: stats.completed, icon: 'fa-check-circle', color: '#858796' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: 16 }}></i>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#858796', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Cancer Type</label>
            <select value={filterCancer} onChange={(e) => setFilterCancer(e.target.value)}>
              <option value="">All types</option>
              {CANCER_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Episode Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All episodes</option>
              {EPISODE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              {EPISODE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>From date</label>
            <DateInput value={filterDateFrom} onChange={v => setFilterDateFrom(v)} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>To date</label>
            <DateInput value={filterDateTo} onChange={v => setFilterDateTo(v)} />
          </div>
        </div>
        {(filterCancer || filterType || filterStatus || filterDateFrom || filterDateTo) && (
          <button className="btn btn-secondary" style={{ marginTop: 10, fontSize: 12 }} onClick={() => { setFilterCancer(''); setFilterType(''); setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); }}>
            <i className="fas fa-times"></i> Clear filters
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, background: '#f0f2fa', borderRadius: 8, padding: 3, flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: tab === t.key ? '#fff' : 'transparent', color: tab === t.key ? '#4e73df' : '#858796', boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            {t.label}{t.count !== undefined && <span style={{ background: tab === t.key ? '#4e73df' : '#dee2e6', color: tab === t.key ? '#fff' : '#495057', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <Loader /> : visibleEpisodes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#b7b9cc' }}>
          <i className="fas fa-calendar-times" style={{ fontSize: 40, marginBottom: 14, display: 'block' }}></i>
          <h3 style={{ margin: '0 0 8px', color: '#5a5c69' }}>No episodes found</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13 }}>
            {tab !== 'all' ? 'No episodes match this filter.' : 'Start by scheduling the first treatment episode.'}
          </p>
          {canCreateTreatment && tab === 'all' && <button className="btn btn-primary" onClick={openCreate}><i className="fas fa-plus"></i> Schedule Episode</button>}
        </div>
      ) : (
        <div className="card premium-table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Cancer</th>
                <th>Episode Type</th>
                <th>Date &amp; Time</th>
                <th>Cycle / Session</th>
                <th>Location</th>
                <th>Status</th>
                <th>Reminder</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleEpisodes.map((ep) => {
                const sm = statusMeta(ep.status);
                const isToday = ep.scheduled_date === today;
                const isLoading = actionLoading === ep.id;
                const sentNow = reminderSent === ep.id;
                const cancerColor = CANCER_COLORS[ep.cancer_type] || '#858796';

                return (
                  <tr key={ep.id} style={{ background: isToday ? '#fffde7' : undefined }}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>
                        {ep.patient_name || `Patient #${ep.patient_id}`}
                        {isToday && <span style={{ marginLeft: 6, fontSize: 10, background: '#fd7e14', color: '#fff', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>TODAY</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#a0aec0' }}>Record #{ep.oncology_record_id}</div>
                    </td>
                    <td>
                      <span style={{ color: cancerColor, fontWeight: 600, fontSize: 12 }}>
                        <i className="fas fa-circle" style={{ fontSize: 7, marginRight: 5 }}></i>
                        {ep.cancer_type || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#2d3748' }}>{episodeTypeLabel(ep.episode_type)}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#2d3748' }}>{ep.scheduled_date}</div>
                      <div style={{ fontSize: 12, color: '#718096' }}>{ep.scheduled_time || '—'}{ep.duration_minutes ? ` · ~${ep.duration_minutes}min` : ''}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {ep.cycle_number ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>Cycle {ep.cycle_number}</div>
                          {ep.session_number && <div style={{ fontSize: 11, color: '#a0aec0' }}>Session {ep.session_number}{ep.total_sessions ? ` of ${ep.total_sessions}` : ''}</div>}
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 13, color: '#4a5568' }}>{ep.location || '—'}</td>
                    <td>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sm.bg, color: sm.color }}>
                        {sm.label}
                      </span>
                    </td>
                    <td>
                      {ep.reminder_sent ? (
                        <span style={{ fontSize: 11, color: '#1cc88a', fontWeight: 600 }}>
                          <i className="fas fa-check"></i> Sent
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#a0aec0' }}>Not sent</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {isLoading ? (
                          <i className="fas fa-spinner fa-spin" style={{ color: '#4e73df', padding: '4px 8px' }}></i>
                        ) : (
                          <>
                            {/* Send Reminder */}
                            {!['completed', 'cancelled', 'missed'].includes(ep.status) && (
                              <button
                                className="btn btn-secondary"
                                style={{ fontSize: 11, padding: '3px 8px', background: sentNow ? '#e6fff5' : undefined, color: sentNow ? '#1cc88a' : undefined }}
                                onClick={() => handleReminder(ep)}
                                title="Send appointment reminder email + notification"
                              >
                                <i className={`fas ${sentNow ? 'fa-check' : 'fa-bell'}`}></i>
                                {sentNow ? ' Sent!' : ' Remind'}
                              </button>
                            )}
                            {/* Confirm */}
                            {ep.status === 'scheduled' && canEditTreatment && (
                              <button className="btn btn-success" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleAction('confirm', ep)}>
                                <i className="fas fa-check"></i> Confirm
                              </button>
                            )}
                            {/* Complete */}
                            {['confirmed', 'in_progress'].includes(ep.status) && canEditTreatment && (
                              <button className="btn btn-primary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleAction('complete', ep)}>
                                <i className="fas fa-check-double"></i> Complete
                              </button>
                            )}
                            {/* Edit */}
                            {!['completed', 'cancelled'].includes(ep.status) && canEditTreatment && (
                              <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => openEdit(ep)}>
                                <i className="fas fa-pen"></i>
                              </button>
                            )}
                            {/* Cancel */}
                            {!['completed', 'cancelled', 'missed'].includes(ep.status) && canEditTreatment && (
                              <button className="btn btn-warning" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => { setCancelId(ep.id); setCancelReason(''); }}>
                                <i className="fas fa-ban"></i>
                              </button>
                            )}
                            {/* Delete */}
                            {canDeleteTreatment && (
                              <button className="btn btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleAction('delete', ep)}>
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <CrudModal open={showModal} title={editId ? 'Edit Episode' : 'Schedule New Episode'} onClose={() => setShowModal(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
            {/* Patient / Record picker — only in create mode */}
            {!editId && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Patient / Oncology Record *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={recordSearch}
                    onChange={(e) => { setRecordSearch(e.target.value); setSelectedRecord(null); setForm((f) => ({ ...f, oncology_record_id: '', patient_id: '' })); }}
                    placeholder="Type patient name or cancer type to search…"
                  />
                  {recordLoading && <i className="fas fa-spinner fa-spin" style={{ position: 'absolute', right: 10, top: 10, color: '#a0aec0' }}></i>}
                  {recordResults.length > 0 && !selectedRecord && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 220, overflowY: 'auto' }}>
                      {recordResults.map((r) => (
                        <div key={r.id} onClick={() => selectRecord(r)} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f0f2fa', fontSize: 13 }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f4ff')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                          <span style={{ fontWeight: 600 }}>{r.patient_name || `Patient #${r.patient_id}`}</span>
                          <span style={{ marginLeft: 8, color: CANCER_COLORS[r.cancer_type] || '#858796', fontSize: 12 }}>{r.cancer_type}</span>
                          <span style={{ marginLeft: 8, color: '#a0aec0', fontSize: 11 }}>Stage {r.clinical_stage || '?'} · Record #{r.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedRecord && (
                  <div style={{ marginTop: 6, padding: '8px 12px', background: '#f0f4ff', borderRadius: 6, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fas fa-user-check" style={{ color: '#4e73df' }}></i>
                    <span><strong>{selectedRecord.patient_name}</strong> · {selectedRecord.cancer_type} · Stage {selectedRecord.clinical_stage || '?'}</span>
                    <button onClick={() => { setSelectedRecord(null); setRecordSearch(''); setForm((f) => ({ ...f, oncology_record_id: '', patient_id: '', cancer_type: '' })); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', fontSize: 16 }}>×</button>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Episode Type *</label>
              <select value={form.episode_type} onChange={(e) => setForm((f) => ({ ...f, episode_type: e.target.value }))}>
                <option value="">Select type…</option>
                {EPISODE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Cancer Type</label>
              <select value={form.cancer_type} onChange={(e) => setForm((f) => ({ ...f, cancer_type: e.target.value }))}>
                <option value="">Select…</option>
                {CANCER_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Scheduled Date *</label>
              <DateInput value={form.scheduled_date} onChange={v => setForm((f) => ({ ...f, scheduled_date: v }))} />
            </div>

            <div className="form-group">
              <label>Time</label>
              <input type="time" value={form.scheduled_time} onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))} />
            </div>

            <div className="form-group">
              <label>Cycle Number</label>
              <input type="number" min="1" value={form.cycle_number} onChange={(e) => setForm((f) => ({ ...f, cycle_number: e.target.value }))} placeholder="e.g. 1" />
            </div>

            <div className="form-group">
              <label>Session in Cycle</label>
              <input type="number" min="1" value={form.session_number} onChange={(e) => setForm((f) => ({ ...f, session_number: e.target.value }))} placeholder="e.g. 1" />
            </div>

            <div className="form-group">
              <label>Total Sessions</label>
              <input type="number" min="1" value={form.total_sessions} onChange={(e) => setForm((f) => ({ ...f, total_sessions: e.target.value }))} placeholder="e.g. 8" />
            </div>

            <div className="form-group">
              <label>Duration (minutes)</label>
              <input type="number" min="1" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} placeholder="e.g. 240" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Location / Ward</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Chemotherapy Day Unit, Ward 5B, Room 12…" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Attending Staff</label>
              <input value={form.attending_staff} onChange={(e) => setForm((f) => ({ ...f, attending_staff: e.target.value }))} placeholder="Dr. Smith, Nurse Johnson…" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Pre-appointment Requirements</label>
              <textarea
                rows={3}
                value={form.pre_requirements}
                onChange={(e) => setForm((f) => ({ ...f, pre_requirements: e.target.value }))}
                placeholder="CBC labs required 24h before. Fasting from midnight. Hydrate well."
              />
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {PRE_REQUIREMENT_SUGGESTIONS.slice(0, 4).map((s) => (
                  <button key={s} type="button" className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => setForm((f) => ({ ...f, pre_requirements: f.pre_requirements ? `${f.pre_requirements}. ${s}` : s }))}>
                    + {s.slice(0, 32)}…
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Internal Notes</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes for the care team" />
            </div>
          </div>

          {formError && <div className="alert alert-danger" style={{ marginTop: 8 }}>{formError}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving…</> : editId ? 'Save Changes' : 'Schedule Episode'}
            </button>
          </div>
        </CrudModal>
      )}

      {/* Cancel Modal */}
      {cancelId && (
        <CrudModal open={!!cancelId} title="Cancel Episode" onClose={() => setCancelId(null)}>
          <p style={{ fontSize: 14, color: '#4a5568', marginBottom: 16 }}>
            Cancelling this episode will send a notification and email to the patient. Please provide a reason.
          </p>
          <div className="form-group">
            <label>Cancellation Reason</label>
            <textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Patient request, lab results not ready, public holiday, etc." />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setCancelId(null)}>Go Back</button>
            <button className="btn btn-danger" onClick={handleCancelSubmit}>
              Cancel Episode &amp; Notify Patient
            </button>
          </div>
        </CrudModal>
      )}
    </div>
  );
}
