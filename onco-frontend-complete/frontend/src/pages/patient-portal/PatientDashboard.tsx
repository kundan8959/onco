import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { oncologyApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import PatientHero from '../../components/PatientHero';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { unread } = useNotifications();
  const [treatments, setTreatments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      oncologyApi.treatments.list({ page_size: 5 }).catch(() => ({ data: { results: [] } })),
      oncologyApi.records.list({ page_size: 3 }).catch(() => ({ data: { results: [] } })),
    ]).then(([t, r]) => {
      setTreatments(t.data.results || t.data || []);
      setRecords(r.data.results || r.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const activeRecord   = records[0];
  const completedCount = treatments.filter((t) => t.status === 'completed').length;
  const progress       = treatments.length > 0 ? completedCount / treatments.length : 0;

  const statusColor = (s: string) => ({
    scheduled: '#3b82f6', completed: '#10b981', delayed: '#f59e0b', cancelled: '#ef4444',
  } as any)[s] || '#6b7280';

  return (
    <div>
      <PatientHero
        firstName={user?.first_name || user?.username}
        progress={progress}
        unread={unread}
      />

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center' }}>Loading your care summary…</div>
      ) : (
        <>
          {/* Active diagnosis card */}
          {activeRecord && (
            <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid #7c3aed', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Current Diagnosis</div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{activeRecord.cancer_type_display || activeRecord.cancer_type}</h3>
                  <div style={{ marginTop: 6, fontSize: 13, color: '#6b7280' }}>
                    Stage {activeRecord.clinical_stage || '—'} · {activeRecord.status || 'Active'}
                    {activeRecord.diagnosis_date && ` · Diagnosed ${activeRecord.diagnosis_date}`}
                  </div>
                </div>
                <Link to="/oncology" className="btn btn-sm btn-info">View Record</Link>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card tone-blue">
              <span>Treatments</span>
              <strong>{treatments.length}</strong>
            </div>
            <div className="metric-card tone-green">
              <span>Completed</span>
              <strong>{treatments.filter((t) => t.status === 'completed').length}</strong>
            </div>
            <div className="metric-card tone-purple">
              <span>Scheduled</span>
              <strong>{treatments.filter((t) => t.status === 'scheduled').length}</strong>
            </div>
            <div className="metric-card tone-amber">
              <span>Notifications</span>
              <strong>{unread}</strong>
            </div>
          </div>

          {/* Upcoming treatments */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Upcoming Treatments</h3>
              <Link to="/treatments" className="btn btn-sm btn-secondary">View All</Link>
            </div>
            {treatments.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '24px 0' }}>No treatment sessions yet.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Type</th><th>Start Date</th><th>Status</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {treatments.slice(0, 5).map((t) => (
                    <tr key={t.id}>
                      <td>{t.treatment_type_display || t.treatment_type}</td>
                      <td>{t.start_date || '—'}</td>
                      <td><span className="badge" style={{ background: statusColor(t.status), color: '#fff' }}>{t.status}</span></td>
                      <td style={{ fontSize: 12, color: '#6b7280' }}>{t.notes?.slice(0, 60) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
