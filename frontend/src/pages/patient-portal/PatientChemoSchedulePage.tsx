import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { episodesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const EPISODE_TYPE_LABELS: Record<string, string> = {
  chemotherapy: 'Chemotherapy',
  radiation: 'Radiation Therapy',
  immunotherapy: 'Immunotherapy',
  targeted_therapy: 'Targeted Therapy',
  surgery: 'Surgical Procedure',
  consultation: 'Consultation',
  follow_up: 'Follow-up Visit',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  missed: 'Missed',
  postponed: 'Postponed',
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: '#4e73df',
  confirmed: '#1cc88a',
  in_progress: '#fd7e14',
  completed: '#858796',
  cancelled: '#e74a3b',
  missed: '#e74a3b',
  postponed: '#f6c23e',
};

const CHECKLIST_ITEMS = [
  { category: 'Before Your Appointment', items: [
    'Drink at least 1–2 litres of water in the hours before your session.',
    'Eat a light meal 1–2 hours before arriving — do not come on an empty stomach.',
    'Take your regular morning medications unless your care team has told you otherwise.',
    'Avoid alcohol for 24 hours before treatment.',
    'Get a good night\'s sleep the evening before.',
  ]},
  { category: 'What to Bring', items: [
    'Photo ID and insurance card.',
    'List of all current medications and supplements.',
    'Any recent lab results or imaging reports.',
    'A blanket or layers — infusion rooms can be cold.',
    'Snacks and water for the session.',
    'Entertainment (book, tablet, headphones) — sessions may take several hours.',
    'A trusted family member or friend if possible.',
  ]},
  { category: 'What to Expect', items: [
    'Nursing staff will review your vitals and recent lab work before starting.',
    'An IV line will be placed — let staff know if you have port access.',
    'Infusion time varies by protocol — typically 2–6 hours.',
    'You may feel tired, nauseous, or have mild discomfort during infusion.',
    'Staff are available throughout — do not hesitate to alert them if anything feels wrong.',
  ]},
  { category: 'After Your Session', items: [
    'Arrange for someone to drive you home — do not drive after chemotherapy.',
    'Rest for the remainder of the day.',
    'Stay hydrated and eat gentle, easy-to-digest foods.',
    'Monitor for fever above 38°C (100.4°F) — contact your care team immediately.',
    'Note any new or worsening symptoms and report them at your next visit.',
  ]},
];

export default function PatientChemoSchedulePage() {
  const { patient } = useAuth();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prepOpen, setPrepOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const printRef = useRef<HTMLDivElement>(null);

  const fetchTreatments = useCallback(async () => {
    if (!patient?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      // Fetch scheduled episodes directly for this patient
      const res = await episodesApi.list({ patient_id: patient.id, page_size: 200 });
      const rows: any[] = res.data.results || res.data || [];
      rows.sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || ''));
      setTreatments(rows);
    } catch {
      setTreatments([]);
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => { fetchTreatments(); }, [fetchTreatments]);

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = useMemo(() => treatments.filter((t) => !['completed', 'cancelled', 'missed'].includes(t.status) && t.scheduled_date >= today), [treatments, today]);
  const _past = useMemo(() => treatments.filter((t) => ['completed', 'cancelled', 'missed'].includes(t.status) || (t.scheduled_date && t.scheduled_date < today)), [treatments, today]); void _past;
  const nextSession = upcoming[0] || null;

  // Group by month for calendar view
  const byMonth = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const t of treatments) {
      if (!t.scheduled_date) continue;
      const month = t.scheduled_date.slice(0, 7); // YYYY-MM
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(t);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [treatments]);

  const formatMonth = (ym: string) => {
    const [year, month] = ym.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>My Treatment Episodes</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #2d3748; margin: 40px; font-size: 13px; }
          h1 { font-size: 22px; color: #1a202c; margin-bottom: 4px; }
          .subtitle { color: #718096; margin-bottom: 24px; font-size: 13px; }
          h2 { font-size: 15px; color: #2b6cb0; margin: 20px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #ebf8ff; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #2b6cb0; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          tr:last-child td { border-bottom: none; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .badge-ready { background: #c6f6d5; color: #276749; }
          .badge-delayed { background: #fed7d7; color: #c53030; }
          .badge-completed { background: #e2e8f0; color: #4a5568; }
          .badge-default { background: #bee3f8; color: #2b6cb0; }
          .footer { margin-top: 32px; font-size: 11px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <h1>My Treatment Episodes</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        ${byMonth.map(([month, sessions]) => `
          <h2>${formatMonth(month)}</h2>
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Cycle / Session</th><th>Location</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody>
              ${sessions.map((s) => `
                <tr>
                  <td>${s.scheduled_date || '—'}</td>
                  <td>${s.scheduled_time || '—'}</td>
                  <td>${EPISODE_TYPE_LABELS[s.episode_type] || s.episode_type || '—'}</td>
                  <td>${s.cycle_number ? `Cycle ${s.cycle_number}${s.session_number ? `, Sess. ${s.session_number}` : ''}` : '—'}</td>
                  <td>${s.location || '—'}</td>
                  <td><span class="badge ${s.status === 'completed' ? 'badge-completed' : s.status === 'cancelled' || s.status === 'missed' ? 'badge-delayed' : s.status === 'confirmed' ? 'badge-ready' : 'badge-default'}">${STATUS_LABELS[s.status] || s.status || '—'}</span></td>
                  <td>${s.notes || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}
        <div class="footer">This document is for personal reference only. Always confirm appointments with your care team.</div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#858796' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, marginBottom: 12, display: 'block' }}></i>
        Loading your schedule…
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title"><i className="fas fa-calendar-days"></i> My Episodes</h2>
          <p className="page-subtitle">All your upcoming and past treatment sessions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handlePrint} disabled={treatments.length === 0}>
            <i className="fas fa-download"></i> Download Schedule
          </button>
          <button className="btn btn-primary" onClick={() => setPrepOpen(true)} disabled={!nextSession}>
            <i className="fas fa-clipboard-check"></i> Prepare for Visit
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Sessions', value: treatments.length, icon: 'fa-syringe', color: '#4e73df' },
          { label: 'Upcoming', value: upcoming.length, icon: 'fa-calendar-plus', color: '#1cc88a' },
          { label: 'Completed', value: treatments.filter((t) => t.status === 'completed').length, icon: 'fa-check-circle', color: '#858796' },
          { label: 'Postponed', value: treatments.filter((t) => t.status === 'postponed').length, icon: 'fa-exclamation-triangle', color: '#f6c23e' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: 16 }}></i>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#858796', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Next session card */}
      {nextSession && (
        <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #4e73df', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <div style={{ background: '#ebf0ff', borderRadius: 10, padding: '12px 16px', textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4e73df', lineHeight: 1 }}>
              {nextSession.scheduled_date ? new Date(nextSession.scheduled_date + 'T00:00:00').getDate() : '—'}
            </div>
            <div style={{ fontSize: 11, color: '#4e73df', fontWeight: 600 }}>
              {nextSession.scheduled_date ? new Date(nextSession.scheduled_date + 'T00:00:00').toLocaleString('default', { month: 'short' }) : ''}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: '#858796', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>Next Session</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#2d3748' }}>
              {EPISODE_TYPE_LABELS[nextSession.episode_type] || nextSession.episode_type}
              {nextSession.cycle_number ? ` — Cycle ${nextSession.cycle_number}${nextSession.session_number ? `, Session ${nextSession.session_number}` : ''}` : ''}
            </div>
            <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>
              {nextSession.cancer_type && <span style={{ marginRight: 12 }}><i className="fas fa-ribbon" style={{ marginRight: 5, color: '#a0aec0' }}></i>{nextSession.cancer_type}</span>}
              {nextSession.scheduled_time && <span style={{ marginRight: 12 }}><i className="fas fa-clock" style={{ marginRight: 5, color: '#a0aec0' }}></i>{nextSession.scheduled_time}</span>}
              {nextSession.location && <span style={{ marginRight: 12 }}><i className="fas fa-location-dot" style={{ marginRight: 5, color: '#a0aec0' }}></i>{nextSession.location}</span>}
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, background: `${STATUS_COLOR[nextSession.status] || '#4e73df'}18`, color: STATUS_COLOR[nextSession.status] || '#4e73df', fontSize: 12, fontWeight: 600 }}>
                {STATUS_LABELS[nextSession.status] || nextSession.status}
              </span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setPrepOpen(true)}>
            <i className="fas fa-clipboard-check"></i> Prepare
          </button>
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: '#f0f2fa', borderRadius: 8, padding: 3, width: 'fit-content' }}>
        {(['calendar', 'list'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '7px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: activeTab === tab ? '#fff' : 'transparent', color: activeTab === tab ? '#4e73df' : '#858796', boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
            <i className={`fas ${tab === 'calendar' ? 'fa-calendar' : 'fa-list'}`} style={{ marginRight: 6 }}></i>
            {tab === 'calendar' ? 'Calendar View' : 'List View'}
          </button>
        ))}
      </div>

      {/* No treatments state */}
      {treatments.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#b7b9cc' }}>
          <i className="fas fa-calendar-xmark" style={{ fontSize: 40, marginBottom: 14, display: 'block' }}></i>
          <h3 style={{ margin: '0 0 8px', color: '#5a5c69' }}>No sessions scheduled yet</h3>
          <p style={{ margin: 0, fontSize: 13 }}>Your treatment episodes will appear here once sessions are scheduled by your care team.</p>
        </div>
      )}

      {/* Calendar view */}
      {activeTab === 'calendar' && treatments.length > 0 && (
        <div ref={printRef}>
          {byMonth.map(([month, sessions]) => (
            <div key={month} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2d3748' }}>{formatMonth(month)}</div>
                <div style={{ height: 1, flex: 1, background: '#e2e8f0' }}></div>
                <div style={{ fontSize: 12, color: '#a0aec0' }}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sessions.map((t) => {
                  const isUpcoming = !['completed', 'cancelled', 'missed'].includes(t.status) && t.scheduled_date >= today;
                  const isToday = t.scheduled_date === today;
                  const statusColor = STATUS_COLOR[t.status] || '#4e73df';
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'stretch', gap: 0, borderRadius: 10, overflow: 'hidden', border: isToday ? '2px solid #4e73df' : '1px solid #e2e8f0', background: isToday ? '#f0f4ff' : '#fff', boxShadow: isUpcoming ? '0 2px 8px rgba(78,115,223,0.08)' : 'none' }}>
                      {/* Date column */}
                      <div style={{ minWidth: 72, background: isToday ? '#4e73df' : isUpcoming ? '#ebf0ff' : '#f7f7f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px 8px' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: isToday ? '#fff' : '#4e73df', lineHeight: 1 }}>
                          {t.scheduled_date ? new Date(t.scheduled_date + 'T00:00:00').getDate() : '—'}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: isToday ? 'rgba(255,255,255,0.8)' : '#a0aec0', letterSpacing: '0.05em' }}>
                          {t.scheduled_date ? new Date(t.scheduled_date + 'T00:00:00').toLocaleString('default', { weekday: 'short' }) : ''}
                        </div>
                        {isToday && <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '1px 5px', marginTop: 3, letterSpacing: '0.05em' }}>TODAY</div>}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#2d3748' }}>{EPISODE_TYPE_LABELS[t.episode_type] || t.episode_type}</div>
                          <div style={{ fontSize: 12, color: '#718096', marginTop: 1 }}>
                            {t.cycle_number ? `Cycle ${t.cycle_number}${t.session_number ? `, Session ${t.session_number}${t.total_sessions ? ` of ${t.total_sessions}` : ''}` : ''}` : ''}
                            {t.location ? `${t.cycle_number ? ' · ' : ''}${t.location}` : ''}
                          </div>
                          {t.cancer_type && <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>{t.cancer_type}</div>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, background: `${statusColor}18`, color: statusColor, fontSize: 11, fontWeight: 600 }}>
                            {STATUS_LABELS[t.status] || t.status}
                          </span>
                          {t.scheduled_time && <span style={{ fontSize: 11, color: '#a0aec0' }}><i className="fas fa-clock" style={{ marginRight: 4 }}></i>{t.scheduled_time}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {activeTab === 'list' && treatments.length > 0 && (
        <div className="card premium-table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Type</th>
                <th>Cycle / Session</th>
                <th>Cancer Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {treatments.map((t) => {
                const sc = STATUS_COLOR[t.status] || '#4e73df';
                return (
                  <tr key={t.id} style={{ background: t.scheduled_date === today ? '#f0f4ff' : undefined }}>
                    <td>
                      {t.scheduled_date || '—'}
                      {t.scheduled_date === today && <span style={{ marginLeft: 6, fontSize: 10, background: '#4e73df', color: '#fff', borderRadius: 4, padding: '1px 5px', fontWeight: 700, letterSpacing: '0.04em' }}>TODAY</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>{t.scheduled_time || '—'}</td>
                    <td><strong>{EPISODE_TYPE_LABELS[t.episode_type] || t.episode_type}</strong></td>
                    <td style={{ fontSize: 12 }}>{t.cycle_number ? `Cycle ${t.cycle_number}${t.session_number ? `, Sess. ${t.session_number}` : ''}` : '—'}</td>
                    <td>{t.cancer_type || '—'}</td>
                    <td style={{ fontSize: 12 }}>{t.location || '—'}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: `${sc}18`, color: sc, fontSize: 11, fontWeight: 600 }}>
                        {STATUS_LABELS[t.status] || t.status || '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: '#718096', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Prepare for Visit modal */}
      {prepOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,30,60,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setPrepOpen(false)}>
          <div style={{ background: '#fff', borderRadius: 14, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: '#2d3748' }}><i className="fas fa-clipboard-check" style={{ color: '#4e73df', marginRight: 10 }}></i>Prepare for Your Visit</h3>
                {nextSession && (
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#718096' }}>
                    Next session: <strong>{EPISODE_TYPE_LABELS[nextSession.episode_type] || nextSession.episode_type}</strong>{nextSession.scheduled_date ? ` on ${nextSession.scheduled_date}` : ''}
                  </p>
                )}
              </div>
              <button onClick={() => setPrepOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#a0aec0', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>×</button>
            </div>
            {/* Modal body */}
            <div style={{ padding: '20px 24px' }}>
              {CHECKLIST_ITEMS.map((section) => (
                <div key={section.category} style={{ marginBottom: 22 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4e73df', marginBottom: 10 }}>{section.category}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {section.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #4e73df', background: '#fff', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-check" style={{ fontSize: 9, color: '#4e73df' }}></i>
                        </div>
                        <span style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#fff5f5', borderRadius: 8, border: '1px solid #fed7d7', fontSize: 12, color: '#c53030' }}>
                <strong><i className="fas fa-phone-alt" style={{ marginRight: 6 }}></i>Emergency Contact:</strong> If you experience fever above 38°C, severe pain, difficulty breathing, or unusual bleeding after treatment, contact your care team or go to the nearest emergency department immediately.
              </div>
            </div>
            <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button className="btn btn-secondary" onClick={() => { setPrepOpen(false); handlePrint(); }}>
                <i className="fas fa-print"></i> Print Schedule
              </button>
              <button className="btn btn-primary" onClick={() => setPrepOpen(false)}>
                I'm Ready
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
