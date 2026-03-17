import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { episodesApi, medicationsApi, oncologyApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

const INTENT_LABELS: Record<string, string> = {
  curative: 'Curative',
  palliative: 'Palliative',
  neoadjuvant: 'Neoadjuvant',
  adjuvant: 'Adjuvant',
  preventive: 'Preventive',
};

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

type TabKey = 'summary' | 'timeline' | 'medications';

export default function PatientTreatmentPlanPage() {
  const { patient } = useAuth();
  const [record, setRecord] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  const fetchData = useCallback(async () => {
    if (!patient?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [recRes, medRes, epRes] = await Promise.all([
        oncologyApi.records.list({ patient_id: patient.id, page_size: 1 }),
        medicationsApi.list({ patient_id: patient.id, page_size: 100 }),
        episodesApi.list({ patient_id: patient.id, page_size: 200 }),
      ]);
      const rec = (recRes.data.results || recRes.data || [])[0] || null;
      setRecord(rec);
      setMedications(medRes.data.results || medRes.data || []);
      const rows: any[] = epRes.data.results || epRes.data || [];
      setEpisodes(rows.sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || '')));
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const today = new Date().toISOString().slice(0, 10);
  const completedCount = episodes.filter((e) => e.status === 'completed').length;
  const upcomingCount = episodes.filter((e) => !['completed', 'cancelled', 'missed'].includes(e.status) && e.scheduled_date >= today).length;
  const firstStart = episodes[0]?.scheduled_date;
  const lastEnd = [...episodes].reverse().find((e) => e.scheduled_date)?.scheduled_date;

  // Group episodes by type for the cycle timeline
  const byType = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const ep of episodes) {
      const key = ep.episode_type || 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ep);
    }
    return [...map.entries()];
  }, [episodes]);

  const handleDownloadPlan = () => {
    if (!record) return;
    const biomarkers = record.biomarkers && typeof record.biomarkers === 'object'
      ? Object.entries(record.biomarkers).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')
      : '';

    const episodeRows = episodes.map((ep) => `
      <tr>
        <td>${ep.scheduled_date || '—'}</td>
        <td>${ep.scheduled_time || '—'}</td>
        <td>${EPISODE_TYPE_LABELS[ep.episode_type] || ep.episode_type || '—'}</td>
        <td>${ep.cycle_number ? `Cycle ${ep.cycle_number}${ep.session_number ? `, Session ${ep.session_number}${ep.total_sessions ? ` of ${ep.total_sessions}` : ''}` : ''}` : '—'}</td>
        <td>${ep.location || '—'}</td>
        <td>${STATUS_LABELS[ep.status] || ep.status || '—'}</td>
        <td>${ep.notes || '—'}</td>
      </tr>
    `).join('');

    const medRows = medications.map((m) => `
      <tr>
        <td>${m.medication_name || m.name || '—'}</td>
        <td>${m.dosage || '—'}</td>
        <td>${m.frequency || '—'}</td>
        <td>${m.status || '—'}</td>
      </tr>
    `).join('');

    const win = window.open('', '_blank', 'width=820,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>My Treatment Plan</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a202c; margin: 0; padding: 40px; font-size: 13px; line-height: 1.6; }
          h1 { font-size: 24px; color: #1a202c; margin: 0 0 2px; }
          .subtitle { color: #718096; font-size: 13px; margin-bottom: 6px; }
          .generated { color: #a0aec0; font-size: 11px; margin-bottom: 28px; border-bottom: 2px solid #ebf4ff; padding-bottom: 12px; }
          h2 { font-size: 14px; font-weight: 700; color: #2b6cb0; text-transform: uppercase; letter-spacing: 0.08em; margin: 28px 0 10px; border-bottom: 1px solid #ebf0ff; padding-bottom: 5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin-bottom: 10px; }
          .field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #a0aec0; display: block; margin-bottom: 2px; }
          .field span { font-size: 13px; font-weight: 600; color: #2d3748; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
          th { background: #ebf4ff; text-align: left; padding: 7px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #2b6cb0; }
          td { padding: 8px 10px; border-bottom: 1px solid #edf2f7; vertical-align: top; }
          .roadmap-item { margin-bottom: 10px; }
          .roadmap-item h4 { margin: 0 0 3px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #4a5568; }
          .roadmap-item p { margin: 0; color: #2d3748; font-size: 13px; }
          .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #a0aec0; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #ebf4ff; color: #2b6cb0; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>My Treatment Plan</h1>
        <div class="subtitle">${record.cancer_type}${record.clinical_stage ? ` · Stage ${record.clinical_stage}` : ''}</div>
        <div class="generated">Generated ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>

        <h2>Diagnosis Overview</h2>
        <div class="grid">
          <div class="field"><label>Cancer Type</label><span>${record.cancer_type || '—'}</span></div>
          <div class="field"><label>Clinical Stage</label><span>${record.clinical_stage || '—'}</span></div>
          <div class="field"><label>Diagnosis Date</label><span>${record.diagnosis_date || '—'}</span></div>
          <div class="field"><label>Treatment Intent</label><span>${INTENT_LABELS[record.treatment_intent] || record.treatment_intent || '—'}</span></div>
          <div class="field"><label>TNM Staging</label><span>${record.t_stage || '—'} / ${record.n_stage || '—'} / ${record.m_stage || '—'}</span></div>
          <div class="field"><label>Grade</label><span>${record.grade || '—'}</span></div>
          <div class="field"><label>Histology</label><span>${record.histology_type || '—'}</span></div>
          <div class="field"><label>ECOG Status</label><span>${record.ecog_performance_status ?? '—'}</span></div>
        </div>

        ${biomarkers ? `<h2>Biomarkers</h2><table><thead><tr><th>Marker</th><th>Value</th></tr></thead><tbody>${biomarkers}</tbody></table>` : ''}

        <h2>Treatment Roadmap</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;">
          ${[
            ['Surgery', record.recommended_surgery],
            ['Chemotherapy', record.recommended_chemotherapy],
            ['Radiation', record.recommended_radiation],
            ['Immunotherapy', record.recommended_immunotherapy],
            ['Targeted Therapy', record.recommended_targeted_therapy],
          ].filter(([, v]) => v).map(([label, val]) => `
            <div class="roadmap-item"><h4>${label}</h4><p>${val}</p></div>
          `).join('')}
        </div>
        ${[record.recommended_surgery, record.recommended_chemotherapy, record.recommended_radiation, record.recommended_immunotherapy, record.recommended_targeted_therapy].every((v) => !v) ? '<p style="color:#a0aec0">No roadmap details recorded yet.</p>' : ''}

        ${episodes.length > 0 ? `
          <h2>Scheduled Sessions (${episodes.length})</h2>
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Cycle / Session</th><th>Location</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody>${episodeRows}</tbody>
          </table>
        ` : ''}

        ${medications.length > 0 ? `
          <h2>Current Medications (${medications.length})</h2>
          <table>
            <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Status</th></tr></thead>
            <tbody>${medRows}</tbody>
          </table>
        ` : ''}

        ${record.clinical_notes ? `<h2>Clinical Notes</h2><p>${record.clinical_notes}</p>` : ''}

        <div class="footer">This document is for personal reference only and does not replace medical advice. Always consult your care team before making any changes to your treatment.</div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#858796' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: 28, marginBottom: 12, display: 'block' }}></i>
        Loading your treatment plan…
      </div>
    );
  }

  if (!record) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#b7b9cc', marginTop: 24 }}>
        <i className="fas fa-file-medical" style={{ fontSize: 40, marginBottom: 14, display: 'block' }}></i>
        <h3 style={{ margin: '0 0 8px', color: '#5a5c69' }}>No treatment plan on record</h3>
        <p style={{ margin: 0, fontSize: 13 }}>Your care team will add a treatment plan once your diagnosis is confirmed.</p>
      </div>
    );
  }

  const tabs: { key: TabKey; icon: string; label: string }[] = [
    { key: 'summary', icon: 'fa-file-medical', label: 'Plan Summary' },
    { key: 'timeline', icon: 'fa-timeline', label: 'Cycle Timeline' },
    { key: 'medications', icon: 'fa-pills', label: 'Medications' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title"><i className="fas fa-file-medical"></i> My Treatment Plan</h2>
          <p className="page-subtitle">{record.cancer_type}{record.clinical_stage ? ` · Stage ${record.clinical_stage}` : ''}{record.treatment_intent ? ` · ${INTENT_LABELS[record.treatment_intent] || record.treatment_intent}` : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={handleDownloadPlan}>
          <i className="fas fa-download"></i> Download Plan
        </button>
      </div>

      {/* Key metric strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Stage', value: record.clinical_stage || '—', icon: 'fa-chart-line', color: '#4e73df' },
          { label: 'Intent', value: INTENT_LABELS[record.treatment_intent] || record.treatment_intent || '—', icon: 'fa-crosshairs', color: '#1cc88a' },
          { label: 'Sessions Done', value: `${completedCount} / ${episodes.length}`, icon: 'fa-syringe', color: '#6f42c1' },
          { label: 'Upcoming', value: String(upcomingCount), icon: 'fa-calendar-plus', color: '#fd7e14' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`fas ${s.icon}`} style={{ color: s.color, fontSize: 16 }}></i>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#858796', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 18, background: '#f0f2fa', borderRadius: 8, padding: 3, width: 'fit-content' }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '7px 20px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: activeTab === tab.key ? '#fff' : 'transparent', color: activeTab === tab.key ? '#4e73df' : '#858796', boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 7 }}>
            <i className={`fas ${tab.icon}`}></i>{tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Summary ── */}
      {activeTab === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* Diagnosis */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-ribbon" style={{ color: '#e74a3b' }}></i> Diagnosis Details
            </h3>
            {([
              ['Cancer Type', record.cancer_type],
              ['ICD-10 Code', record.icd10_code],
              ['Diagnosis Date', record.diagnosis_date],
              ['Clinical Stage', record.clinical_stage],
              ['TNM', [record.t_stage, record.n_stage, record.m_stage].filter(Boolean).join(' / ') || null],
              ['Grade', record.grade],
              ['Histology', record.histology_type],
              ['Tumour Size', record.tumor_size_cm ? `${record.tumor_size_cm} cm` : null],
              ['Lymph Nodes', record.lymph_node_involvement ? 'Involved' : 'Not involved'],
              ['Metastasis', record.metastasis_present ? 'Present' : 'Not detected'],
              ['ECOG Status', record.ecog_performance_status?.toString()],
            ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f2fa', fontSize: 13 }}>
                <span style={{ color: '#718096' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#2d3748', textAlign: 'right', maxWidth: '55%' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Treatment Roadmap */}
          <div className="card">
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-map-signs" style={{ color: '#4e73df' }}></i> Recommended Treatment
            </h3>
            {[
              { label: 'Surgery', icon: 'fa-scalpel', value: record.recommended_surgery, color: '#e74a3b' },
              { label: 'Chemotherapy', icon: 'fa-syringe', value: record.recommended_chemotherapy, color: '#6f42c1' },
              { label: 'Radiation', icon: 'fa-radiation', value: record.recommended_radiation, color: '#fd7e14' },
              { label: 'Immunotherapy', icon: 'fa-shield-virus', value: record.recommended_immunotherapy, color: '#1cc88a' },
              { label: 'Targeted Therapy', icon: 'fa-crosshairs', value: record.recommended_targeted_therapy, color: '#4e73df' },
            ].filter((r) => r.value).map((row) => (
              <div key={row.label} style={{ marginBottom: 12, padding: '10px 12px', background: `${row.color}08`, borderLeft: `3px solid ${row.color}`, borderRadius: '0 6px 6px 0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: row.color, marginBottom: 4 }}>
                  <i className={`fas ${row.icon}`} style={{ marginRight: 6 }}></i>{row.label}
                </div>
                <div style={{ fontSize: 13, color: '#2d3748' }}>{row.value}</div>
              </div>
            ))}
            {![record.recommended_surgery, record.recommended_chemotherapy, record.recommended_radiation, record.recommended_immunotherapy, record.recommended_targeted_therapy].some(Boolean) && (
              <p style={{ color: '#a0aec0', fontSize: 13, margin: 0 }}>Roadmap not yet recorded. Your care team will update this section.</p>
            )}
          </div>

          {/* Biomarkers */}
          {record.biomarkers && Object.keys(record.biomarkers).length > 0 && (
            <div className="card">
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-dna" style={{ color: '#6f42c1' }}></i> Biomarkers
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {Object.entries(record.biomarkers).map(([k, v]) => (
                  <div key={k} style={{ padding: '8px 12px', background: '#f8f0ff', borderRadius: 6, fontSize: 13 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a0aec0', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 700, color: '#6f42c1' }}>{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinical notes */}
          {record.clinical_notes && (
            <div className="card">
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#2d3748', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-notes-medical" style={{ color: '#858796' }}></i> Clinical Notes
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#4a5568', lineHeight: 1.7 }}>{record.clinical_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Cycle Timeline ── */}
      {activeTab === 'timeline' && (
        <div>
          {episodes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#b7b9cc' }}>
              <i className="fas fa-timeline" style={{ fontSize: 40, marginBottom: 14, display: 'block' }}></i>
              <h3 style={{ margin: '0 0 8px', color: '#5a5c69' }}>No sessions scheduled yet</h3>
              <p style={{ margin: 0, fontSize: 13 }}>Your care team will schedule your treatment sessions here.</p>
            </div>
          ) : (
            <>
              {/* Date range bar */}
              {firstStart && (
                <div className="card" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', background: '#f0f4ff', border: '1px solid #dbe4ff' }}>
                  <i className="fas fa-calendar-range" style={{ color: '#4e73df', fontSize: 16 }}></i>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#858796', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 2 }}>Treatment Period</div>
                    <div style={{ fontWeight: 700, color: '#2d3748', fontSize: 14 }}>{firstStart} → {lastEnd || 'Ongoing'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {[
                  { label: 'Total', value: episodes.length, color: '#4e73df' },
                      { label: 'Completed', value: completedCount, color: '#1cc88a' },
                      { label: 'Upcoming', value: upcomingCount, color: '#fd7e14' },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: '#a0aec0' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline by type */}
              {byType.map(([type, sessions], typeIdx) => (
                <div key={type} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: ['#4e73df', '#1cc88a', '#6f42c1', '#fd7e14', '#e74a3b'][typeIdx % 5], flexShrink: 0 }}></div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#2d3748' }}>{EPISODE_TYPE_LABELS[type] || type}</div>
                    <div style={{ height: 1, flex: 1, background: '#e2e8f0' }}></div>
                    <div style={{ fontSize: 12, color: '#a0aec0' }}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</div>
                  </div>

                  <div style={{ position: 'relative', paddingLeft: 28 }}>
                    {/* Vertical line */}
                    <div style={{ position: 'absolute', left: 4, top: 0, bottom: 0, width: 2, background: '#e2e8f0', borderRadius: 2 }}></div>

                    {sessions.map((ep, idx) => {
                      const isDone = ep.status === 'completed';
                      const isCancelled = ep.status === 'cancelled' || ep.status === 'missed';
                      const isToday = ep.scheduled_date === today;
                      const dotColor = STATUS_COLOR[ep.status] || '#4e73df';
                      const cycleLabel = ep.cycle_number
                        ? `Cycle ${ep.cycle_number}${ep.session_number ? `, Session ${ep.session_number}${ep.total_sessions ? ` of ${ep.total_sessions}` : ''}` : ''}`
                        : null;

                      return (
                        <div key={ep.id} style={{ position: 'relative', marginBottom: idx < sessions.length - 1 ? 12 : 0 }}>
                          {/* Dot */}
                          <div style={{ position: 'absolute', left: -24, top: 14, width: 10, height: 10, borderRadius: '50%', background: dotColor, border: `2px solid ${isDone ? dotColor : '#fff'}`, boxShadow: `0 0 0 2px ${dotColor}40` }}></div>

                          <div style={{ border: isToday ? `2px solid #4e73df` : '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', background: isToday ? '#f0f4ff' : isDone ? '#f9fafb' : isCancelled ? '#fff8f8' : '#fff', display: 'flex', alignItems: 'center', gap: 12, opacity: isCancelled ? 0.7 : 1 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: 14, color: '#2d3748' }}>
                                  {cycleLabel || `Session ${idx + 1}`}
                                </span>
                                {isToday && <span style={{ fontSize: 10, background: '#4e73df', color: '#fff', borderRadius: 4, padding: '1px 6px', fontWeight: 700, letterSpacing: '0.04em' }}>TODAY</span>}
                                {isDone && <span style={{ fontSize: 10, background: '#e2e8f0', color: '#718096', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>DONE</span>}
                                {isCancelled && <span style={{ fontSize: 10, background: '#ffe0e0', color: '#e74a3b', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>{ep.status.toUpperCase()}</span>}
                              </div>
                              <div style={{ fontSize: 12, color: '#718096', marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: '0 14px' }}>
                                {ep.scheduled_date && <span><i className="fas fa-calendar" style={{ marginRight: 4, color: '#a0aec0' }}></i>{ep.scheduled_date}{ep.scheduled_time ? ` at ${ep.scheduled_time}` : ''}</span>}
                                {ep.location && <span><i className="fas fa-location-dot" style={{ marginRight: 4, color: '#a0aec0' }}></i>{ep.location}</span>}
                                {ep.attending_staff && <span><i className="fas fa-user-doctor" style={{ marginRight: 4, color: '#a0aec0' }}></i>{ep.attending_staff}</span>}
                              </div>
                              {ep.notes && <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 3, fontStyle: 'italic' }}>{ep.notes}</div>}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <span style={{ padding: '3px 10px', borderRadius: 20, background: `${dotColor}18`, color: dotColor, fontSize: 11, fontWeight: 600 }}>
                                {STATUS_LABELS[ep.status] || ep.status}
                              </span>
                              {ep.cancer_type && (
                                <div style={{ marginTop: 4, fontSize: 11, color: '#a0aec0' }}>{ep.cancer_type}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── TAB: Medications ── */}
      {activeTab === 'medications' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: '#718096' }}>{medications.length} medication{medications.length !== 1 ? 's' : ''} on record</div>
            <Link to="/medications" className="btn btn-secondary" style={{ fontSize: 12 }}>
              <i className="fas fa-external-link-alt"></i> Manage Medications
            </Link>
          </div>

          {medications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: '#b7b9cc' }}>
              <i className="fas fa-pills" style={{ fontSize: 40, marginBottom: 14, display: 'block' }}></i>
              <h3 style={{ margin: '0 0 8px', color: '#5a5c69' }}>No medications recorded</h3>
              <p style={{ margin: 0, fontSize: 13 }}>Your prescriptions will appear here once added by your care team.</p>
            </div>
          ) : (
            <div className="card premium-table-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Route</th>
                    <th>Start Date</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map((m: any) => (
                    <tr key={m.id}>
                      <td><strong>{m.medication_name || m.name || m.medicine_name ||'—'}</strong></td>
                      <td>{m.dosage || '—'}</td>
                      <td>{m.frequency || '—'}</td>
                      <td style={{ fontSize: 12, color: '#718096' }}>{m.route || '—'}</td>
                      <td style={{ fontSize: 12, color: '#718096' }}>{m.start_date || '—'}</td>
                      <td>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: m.status === 'active' ? '#d4edda' : '#e2e8f0', color: m.status === 'active' ? '#155724' : '#6c757d' }}>
                          {m.status || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: '#718096', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
