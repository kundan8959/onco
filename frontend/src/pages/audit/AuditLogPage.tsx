import { useEffect, useMemo, useState } from 'react';
import { auditApi } from '../../api';

export default function AuditLogPage() {
  const [data, setData] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    auditApi.list({ search, status: status || undefined, page_size: 200 }).then((r) => {
      setData(r.data.results || []);
      setCount(r.data.count || 0);
    }).catch(() => {
      setData([]);
      setCount(0);
    });
  }, [search, status]);

  const rows = useMemo(() => data, [data]);

  return (
    <div>
      <div className="page-header"><h2 className="page-title"><i className="fas fa-clipboard-list"></i> Audit Log</h2></div>
      <div className="module-intro-card">
        <div>
          <span className="eyebrow">Traceability</span>
          <h3>Persisted audit events are live now.</h3>
          <p>Admin CRUD actions are written here for real. No more synthetic pretend-event collage.</p>
        </div>
        <div className="metric-chip-row">
          <span className="metric-chip info">Events: {count}</span>
          <span className="metric-chip success">OK: {rows.filter((row) => row.status === 'ok').length}</span>
          <span className="metric-chip warning">Inactive: {rows.filter((row) => String(row.status).includes('inactive')).length}</span>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <div className="form-group"><label>Search events</label><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="actor, action, entity, summary..." /></div>
          <div className="form-group"><label>Status filter</label><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option><option value="ok">OK</option><option value="inactive">Inactive</option></select></div>
        </div>
      </div>
      <div className="card premium-table-card">
        <div className="card-header"><h3>Persisted audit events</h3><span className="result-count">{rows.length} row{rows.length === 1 ? '' : 's'}</span></div>
        <table className="table admin-table">
          <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Scope</th><th>Status</th><th>Summary</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td><strong>{row.actor}</strong><div className="field-help">{row.actor_role}</div></td>
                <td>{row.action} {row.entity_type}</td>
                <td>{row.scope || 'Platform'}</td>
                <td><span className={`badge ${String(row.status).includes('inactive') ? 'badge-danger' : 'badge-success'}`}>{String(row.status).toUpperCase()}</span></td>
                <td>{row.summary || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center">No audit events match the current filters</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
