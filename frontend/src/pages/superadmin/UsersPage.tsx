import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminUsersApi } from '../../api';
import CrudModal from '../../components/CrudModal';

const emptyForm = {
  username: '',
  password: '',
  first_name: '',
  last_name: '',
  email: '',
  role: 'patient',
  hospital_name: '',
  is_active: true,
  is_staff: false,
  is_superuser: false,
};

export default function UsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | 'superadmin' | 'hospital' | 'patient'>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);

  const fetchData = useCallback(async () => {
    const res = await adminUsersApi.list({ search, role: role === 'all' ? undefined : role, page_size: 200 });
    setItems(res.data.results || []);
  }, [role, search]);

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
      const payload = { ...form };
      if (payload.role === 'superadmin') {
        payload.is_staff = true;
        payload.is_superuser = true;
      }
      if (payload.role === 'hospital') {
        payload.is_staff = true;
      }
      if (payload.role === 'patient') {
        payload.is_staff = false;
        payload.is_superuser = false;
      }
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
      role: item.role || 'patient',
      hospital_name: item.hospital_name || '',
      is_active: !!item.is_active,
      is_staff: !!item.is_staff,
      is_superuser: !!item.is_superuser,
    });
    setOpen(true);
  };

  const deactivate = async (id: number) => {
    if (!window.confirm('Deactivate this account?')) return;
    await adminUsersApi.delete(id);
    fetchData();
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-users-gear"></i> Users</h2>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>Create User</button>
      </div>

      <div className="module-intro-card">
        <div>
          <span className="eyebrow">Administration</span>
          <h3>User Account Management</h3>
          <p>Create and manage user accounts across all roles. Assign hospital affiliations, update permissions, and control access.</p>
        </div>
        <div className="metric-chip-row">
          <span className="metric-chip info">Total: {items.length}</span>
          <span className="metric-chip success">Active: {items.filter((item) => item.is_active).length}</span>
          <span className="metric-chip warning">Hospital: {items.filter((item) => item.role === 'hospital').length}</span>
          <span className="metric-chip danger">Superadmin: {items.filter((item) => item.role === 'superadmin').length}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <div className="form-group"><label>Search accounts</label><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Username, email, hospital..." /></div>
          <div className="form-group"><label>Role</label><select value={role} onChange={(e) => setRole(e.target.value as any)}><option value="all">All roles</option><option value="superadmin">Superadmin</option><option value="hospital">Hospital</option><option value="patient">Patient</option></select></div>
          <div className="form-group"><label>Status</label><select value={status} onChange={(e) => setStatus(e.target.value as any)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
      </div>

      <div className="card premium-table-card">
        <div className="card-header"><h3>Accounts</h3><span className="result-count">{rows.length} result{rows.length === 1 ? '' : 's'}</span></div>
        <table className="table admin-table">
          <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Hospital</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{row.full_name || row.username}</strong><div className="field-help">{row.email || 'No email'}</div></td>
                <td>{row.username}</td>
                <td><span className="badge badge-info">{row.role}</span></td>
                <td>{row.hospital_name || '—'}</td>
                <td><span className={`badge ${row.is_active ? 'badge-success' : 'badge-danger'}`}>{row.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td className="actions"><button className="btn btn-sm btn-warning" onClick={() => edit(row)}>Edit</button><button className="btn btn-sm btn-danger" onClick={() => deactivate(row.id)}>Deactivate</button></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="text-center">No accounts match the current filters</td></tr>}
          </tbody>
        </table>
      </div>

      <CrudModal open={open} title={editingId ? 'Edit User Account' : 'Create User Account'} onClose={resetForm}>
        <form onSubmit={submit} className="form-grid">
          <div className="form-group"><label>Username</label><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required /></div>
          <div className="form-group"><label>{editingId ? 'New Password (optional)' : 'Password'}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingId} /></div>
          <div className="form-group"><label>First Name</label><input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></div>
          <div className="form-group"><label>Last Name</label><input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group"><label>Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="superadmin">Superadmin</option><option value="hospital">Hospital</option><option value="patient">Patient</option></select></div>
          <div className="form-group"><label>Hospital Name</label><input value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} placeholder="Required for hospital/patient context" /></div>
          <div className="form-group checkbox-group"><label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active account</label></div>
          <div className="form-group checkbox-group"><label><input type="checkbox" checked={form.is_staff} onChange={(e) => setForm({ ...form, is_staff: e.target.checked })} /> Staff</label></div>
          <div className="form-group checkbox-group"><label><input type="checkbox" checked={form.is_superuser} onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })} /> Superuser</label></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update User' : 'Create User'}</button></div>
        </form>
      </CrudModal>
    </div>
  );
}
