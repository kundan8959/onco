import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, patientsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

interface Stats {
  total_patients: number;
  total_allergies: number;
  active_medications: number;
  active_conditions: number;
}

const roleCopy = {
  superadmin: {
    title: 'Platform Administration',
    subtitle: 'Manage hospitals, users, analytics, and audit activity across the platform.',
  },
  hospital: {
    title: 'Hospital Dashboard',
    subtitle: 'Oncology operations including diagnosis, treatment planning, symptom tracking, and payer submissions.',
  },
  patient: {
    title: 'My Care Dashboard',
    subtitle: 'View your care journey, medications, vitals, and oncology records.',
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  useEffect(() => {
    dashboardApi.getStats().then(r => setStats(r.data)).catch(() => setStats(null));
    patientsApi.list({ page_size: 5 }).then(r => setRecentPatients(r.data.results || [])).catch(() => setRecentPatients([]));
  }, []);

  const copy = roleCopy[user?.role || 'patient'];

  const cards = [
    { label: 'Total Patients', value: stats?.total_patients, icon: 'fa-user-injured', tone: 'blue', link: '/patients' },
    { label: 'Total Allergies', value: stats?.total_allergies, icon: 'fa-allergies', tone: 'red', link: '/allergies' },
    { label: 'Active Medications', value: stats?.active_medications, icon: 'fa-pills', tone: 'green', link: '/medications' },
    { label: 'Active Conditions', value: stats?.active_conditions, icon: 'fa-notes-medical', tone: 'amber', link: '/conditions' },
  ];

  return (
    <div>
      <div className="page-header page-header-premium">
        <div>
          <div className="page-eyebrow">Dashboard</div>
          <h1 className="page-title premium-page-title">{copy.title}</h1>
          <p className="page-subtitle">{copy.subtitle}</p>
        </div>
        <div className="hero-actions">
          <Link to="/patients" className="primary-button">Open Patients</Link>
          <Link to="/oncology" className="ghost-button">Open Oncology</Link>
        </div>
      </div>
      <div className="hero-card premium-dashboard-hero">
        <div>
          <div className="hero-kicker">Dashboard</div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
          <div className="hero-badge-row">
            <span className="hero-badge">Role: {user?.role}</span>
            {user?.hospital_name && <span className="hero-badge">Hospital: {user.hospital_name}</span>}
          </div>
        </div>
        <div className="dashboard-hero-side">
          <div className="hero-glass-stat">
            <span>Role</span>
            <strong>{user?.role}</strong>
          </div>
          {user?.hospital_name ? (
            <div className="hero-glass-stat">
              <span>Hospital</span>
              <strong>{user.hospital_name}</strong>
            </div>
          ) : null}
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((c, i) => (
          <Link to={c.link} key={i} className={`stat-card tone-${c.tone}`}>
            <div className="stat-info">
              <div className="stat-label">{c.label}</div>
              <div className="stat-value">{c.value ?? '...'}</div>
            </div>
            <i className={`fas ${c.icon} stat-icon`}></i>
          </Link>
        ))}
      </div>

      <div className="panel-grid mt-4">
        <section className="info-panel">
          <div className="panel-title">Clinical Priorities</div>
          <ul>
            <li>Review pending oncology diagnoses</li>
            <li>Track active treatment plans and upcoming sessions</li>
            <li>Monitor patient-reported symptoms</li>
            <li>Follow up on payer submission statuses</li>
          </ul>
        </section>
        <section className="info-panel">
          <div className="panel-title">Notifications</div>
          <ul>
            <li>New patient registrations</li>
            <li>Treatment schedule changes</li>
            <li>Symptom escalations requiring review</li>
            <li>Payer claim status updates</li>
          </ul>
        </section>
      </div>

      <div className="card mt-4 premium-table-card">
        <div className="card-header">
          <h3>Recent Patients</h3>
          <Link to="/patients" className="btn btn-sm btn-primary">View All</Link>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>MRN</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentPatients.map((p: any) => (
              <tr key={p.id}>
                <td><Link to={`/patients/${p.id}`}>{p.medical_record_number}</Link></td>
                <td><strong>{p.full_name || `${p.first_name} ${p.last_name}`}</strong></td>
                <td>{p.age ? `${p.age} years` : '-'}</td>
                <td>{p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}</td>
                <td><span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>{p.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
              </tr>
            ))}
            {recentPatients.length === 0 && <tr><td colSpan={5} className="text-center">No patients yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
