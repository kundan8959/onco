import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminUsersApi } from '../../api';
import CrudModal from '../../components/CrudModal';

const emptyForm = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  hospital_name: '',
  is_active: true,
};

export default function HospitalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    const res = await adminUsersApi.list({ role: 'hospital', search, page_size: 200 });
    setItems(res.data.results || []);
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const rows = useMemo(() => items.filter((row) => status === 'all' || (row.is_active ? 'active' : 'inactive') === status), [items, status]);

  const resetForm = () => {
    setOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        role: 'hospital',
        is_staff: true,
        is_superuser: false,
      };
      if (editingId) {
        if (!payload.password) delete payload.password;
        await adminUsersApi.update(editingId, payload);
      } else {
        await adminUsersApi.create(payload);
      }
      resetForm();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const edit = (item: any) => {
    setEditingId(item.id);
    setForm({
      username: item.username || '',
      password: '',
      first_name: item.first_name || '',
      last_name: item.last_name || '',
      email: item.email || '',
      hospital_name: item.hospital_name || '',
      is_active: !!item.is_active,
    });
    setOpen(true);
  };

  const deactivate = async (id: number) => {
    if (!window.confirm('Deactivate this hospital account?')) return;
    await adminUsersApi.delete(id);
    fetchData();
  };

  const activeCount = items.filter((item) => item.is_active).length;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-hospital-user"></i> Hospital Tenants</h2>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>Add Hospital</button>
      </div>

      <div className="module-intro-card">
        <div>
          <span className="eyebrow">Superadmin · Hospitals</span>
          <h3>Real tenant CRUD is live now.</h3>
          <p>Create hospital accounts, update tenant details, and deactivate access. This is finally an admin screen, not a glossy hostage note from the future.</p>
        </div>
        <div className="metric-chip-row">
          <span className="metric-chip success">Active tenants: {activeCount}</span>
          <span className="metric-chip info">Total tenants: {items.length}</span>
          <span className="metric-chip warning">Inactive: {items.length - activeCount}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <div className="form-group">
            <label>Search tenants</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hospital name, username, email..." />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="all">All tenants</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card premium-table-card">
        <div className="card-header">
          <h3>Hospital accounts</h3>
          <span className="result-count">{rows.length} result{rows.length === 1 ? '' : 's'}</span>
        </div>
        <table className="table admin-table">
          <thead>
            <tr><th>Hospital</th><th>Username</th><th>Contact</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.hospital_name || row.username}</strong></td>
                <td>{row.username}</td>
                <td>{row.email || '—'}</td>
                <td><span className={`badge ${row.is_active ? 'badge-success' : 'badge-danger'}`}>{row.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td className="actions"><button className="btn btn-sm btn-warning" onClick={() => edit(row)}>Edit</button><button className="btn btn-sm btn-danger" onClick={() => deactivate(row.id)}>Deactivate</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="text-center">No hospitals match the current filters</td></tr>}
          </tbody>
        </table>
      </div>

      <CrudModal open={open} title={editingId ? 'Edit Hospital Tenant' : 'Create Hospital Tenant'} onClose={resetForm}>
        <form onSubmit={submit} className="form-grid">
          <div className="form-group"><label>Hospital Name</label><input value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} required /></div>
          <div className="form-group"><label>Username</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          <div className="form-group"><label>Admin First Name</label><input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div className="form-group"><label>Admin Last Name</label><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group"><label>{editingId ? 'New Password (optional)' : 'Password'}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} /></div>
          <div className="form-group checkbox-group"><label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active tenant</label></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Tenant' : 'Create Tenant'}</button></div>
        </form>
      </CrudModal>
    </div>
  );
}
