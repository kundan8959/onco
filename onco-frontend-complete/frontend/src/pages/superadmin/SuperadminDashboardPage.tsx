import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminUsersApi, auditApi } from '../../api';

interface Counts {
  hospitals: number;
  activeHospitals: number;
  superadmins: number;
  totalUsers: number;
}

export default function SuperadminDashboardPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recentAudit, setRecentAudit] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      adminUsersApi.list({ page_size: 500 }),
      auditApi.list({ page_size: 6 }),
    ]).then(([usersRes, auditRes]) => {
      const users: any[] = usersRes.data.results || usersRes.data || [];
      const hospitals = users.filter((u) => u.role === 'hospital');
      setCounts({
        hospitals: hospitals.length,
        activeHospitals: hospitals.filter((h) => h.is_active).length,
        superadmins: users.filter((u) => u.role === 'superadmin').length,
        totalUsers: users.length,
      });
      setRecentAudit(auditRes.data.results || auditRes.data || []);
    }).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Hospital Tenants', value: counts?.hospitals, icon: 'fa-hospital', tone: 'blue', link: '/superadmin/hospitals' },
    { label: 'Active Tenants', value: counts?.activeHospitals, icon: 'fa-check-circle', tone: 'green', link: '/superadmin/hospitals' },
    { label: 'Platform Users', value: counts?.totalUsers, icon: 'fa-users', tone: 'purple', link: '/superadmin/users' },
    { label: 'Superadmins', value: counts?.superadmins, icon: 'fa-shield-halved', tone: 'amber', link: '/superadmin/users' },
  ];

  const quickLinks = [
    { label: 'Hospital Management', desc: 'Create, edit, and manage hospital tenants', icon: 'fa-hospital-user', link: '/superadmin/hospitals', tone: 'blue' },
    { label: 'User Management', desc: 'Manage platform accounts and role assignments', icon: 'fa-users-gear', link: '/superadmin/users', tone: 'purple' },
    { label: 'Platform Analytics', desc: 'Cross-hospital oncology trends and cohort data', icon: 'fa-chart-column', link: '/superadmin/analytics', tone: 'green' },
    { label: 'Audit Logs', desc: 'Security events, logins, AI approvals, and exports', icon: 'fa-list-check', link: '/superadmin/audit', tone: 'amber' },
  ];

  return (
    <div>
      <div className="page-header page-header-premium">
        <div>
          <div className="page-eyebrow">Superadmin</div>
          <h1 className="page-title premium-page-title">
            <i className="fas fa-shield-halved"></i> Platform Administration
          </h1>
          <p className="page-subtitle">Manage hospitals, users, analytics, and platform-wide audit activity.</p>
        </div>
        <div className="hero-actions">
          <Link to="/superadmin/hospitals" className="primary-button">
            <i className="fas fa-plus"></i> Add Hospital
          </Link>
          <Link to="/superadmin/users" className="ghost-button">Manage Users</Link>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <Link to={card.link} key={card.label} className={`stat-card tone-${card.tone}`}>
            <div className="stat-info">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value ?? '…'}</div>
            </div>
            <i className={`fas ${card.icon} stat-icon`}></i>
          </Link>
        ))}
      </div>

      <div className="panel-grid mt-4">
        {quickLinks.map((ql) => (
          <Link to={ql.link} key={ql.label} className="info-panel info-panel-link">
            <div className={`panel-icon-wrap tone-${ql.tone}`}>
              <i className={`fas ${ql.icon}`}></i>
            </div>
            <div>
              <div className="panel-title">{ql.label}</div>
              <p className="panel-desc">{ql.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {recentAudit.length > 0 && (
        <div className="card premium-table-card mt-4">
          <div className="card-header">
            <h3><i className="fas fa-clock-rotate-left"></i> Recent Platform Activity</h3>
            <Link to="/superadmin/audit" className="btn btn-sm btn-secondary">View all logs</Link>
          </div>
          <table className="table admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>User</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentAudit.map((entry, i) => (
                <tr key={entry.id ?? i}>
                  <td>{entry.action || entry.event || '—'}</td>
                  <td>{entry.username || entry.user || '—'}</td>
                  <td>
                    <span className={`badge ${entry.status === 'success' || entry.status === 'ok' ? 'badge-success' : entry.status === 'failure' || entry.status === 'error' ? 'badge-danger' : 'badge-secondary'}`}>
                      {entry.status || 'info'}
                    </span>
                  </td>
                  <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                    {entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
