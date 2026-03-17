import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { patientsApi } from '../../api';
import { useConfirm } from '../../hooks/useConfirm';
import { useLoading } from '../../hooks/useLoading';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';

export default function PatientListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [patients, setPatients] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const { confirm } = useConfirm();
  const { withLoading } = useLoading();
  const { canCreatePatient, canEditPatient, canDeletePatient } = usePermissions();
  const dispatch = useAppDispatch();
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    const res = await patientsApi.list({ search, page, page_size: pageSize });
    setPatients(res.data.results || res.data);
    setCount(res.data.count || res.data.length);
  }, [search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(count / pageSize);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({ search, page: '1' });
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete patient',
      message: 'This patient will be marked inactive/removed from the visible list. Continue?',
      confirmText: 'Delete',
    });
    if (!ok) return;
    await withLoading(async () => {
      await patientsApi.delete(id);
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: 'Patient deleted successfully.' }));
    });
  };

  const genderLabel = (g: string) => g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other';
  const bloodGroupColor = (bg: string) => {
    const map: any = { 'A+': '#e74a3b', 'A-': '#fd7e14', 'B+': '#4e73df', 'B-': '#36b9cc', 'O+': '#1cc88a', 'O-': '#858796', 'AB+': '#f6c23e', 'AB-': '#6f42c1' };
    return map[bg] || '#858796';
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-user-injured"></i> Patients</h2>
        {canCreatePatient && <Link to="/patients/add" className="btn btn-primary"><i className="fas fa-plus"></i> Add Patient</Link>}
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by name, MRN, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn-primary"><i className="fas fa-search"></i></button>
      </form>

      <div className="result-count">{count} patient(s) found</div>

      <div className="card premium-table-card">
        <table className="table">
          <thead>
            <tr>
              <th>MRN</th>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Blood Group</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p: any) => (
              <tr key={p.id}>
                <td><Link to={`/patients/${p.id}`} className="link-primary">{p.medical_record_number}</Link></td>
                <td><strong>{p.full_name || `${p.first_name} ${p.last_name}`}</strong></td>
                <td>{p.age ? `${p.age}y` : '-'}</td>
                <td>{genderLabel(p.gender)}</td>
                <td>
                  {p.blood_group ? (
                    <span className="badge" style={{ backgroundColor: bloodGroupColor(p.blood_group) }}>{p.blood_group}</span>
                  ) : '-'}
                </td>
                <td>{p.contact_number || '-'}</td>
                <td>
                  <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="actions">
                  <Link to={`/patients/${p.id}`} className="btn btn-sm btn-info" title="View"><i className="fas fa-eye"></i></Link>
                  {canEditPatient && <Link to={`/patients/${p.id}/edit`} className="btn btn-sm btn-warning" title="Edit"><i className="fas fa-edit"></i></Link>}
                  {canDeletePatient && <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-danger" title="Delete"><i className="fas fa-trash"></i></button>}
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan={8} className="text-center">No patients found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm">Prev</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const p = i + 1;
            return <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : ''}`} onClick={() => setPage(p)}>{p}</button>;
          })}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-sm">Next</button>
        </div>
      )}
    </div>
  );
}
