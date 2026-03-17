import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { oncologyApi } from '../../api';
import { useConfirm } from '../../hooks/useConfirm';
import { useLoading } from '../../hooks/useLoading';
import { usePermissions } from '../../hooks/usePermissions';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';

const FOUR_CANCERS = ['Breast Cancer', 'Prostate Cancer', 'Lung Cancer', 'Colorectal Cancer'];

export default function OncologyListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [cancerFilter, setCancerFilter] = useState(searchParams.get('cancer_type') || '');
  const [patientSearch, setPatientSearch] = useState(searchParams.get('search') || '');
  const { confirm } = useConfirm();
  const { withLoading } = useLoading();
  const { canCreateOncologyRecord, canEditOncologyRecord, canDeleteOncologyRecord } = usePermissions();
  const dispatch = useAppDispatch();
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    const res = await oncologyApi.records.list({
      page,
      page_size: pageSize,
      cancer_type: cancerFilter || undefined,
      search: patientSearch || undefined,
    });
    setItems(res.data.results || res.data);
    setCount(res.data.count || res.data.length);
  }, [page, cancerFilter, patientSearch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(count / pageSize);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({
      ...(patientSearch ? { search: patientSearch } : {}),
      ...(cancerFilter ? { cancer_type: cancerFilter } : {}),
      page: '1',
    });
    fetchData();
  };

  const clearFilters = () => {
    setPatientSearch('');
    setCancerFilter('');
    setPage(1);
    setSearchParams({ page: '1' });
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete oncology record',
      message: 'This oncology record will be removed from the active workflow. Continue?',
      confirmText: 'Delete',
    });
    if (!ok) return;
    await withLoading(async () => {
      await oncologyApi.records.delete(id);
      await fetchData();
      dispatch(showNotice({ kind: 'success', text: 'Oncology record deleted successfully.' }));
    });
  };

  const stageColor = (s: string) => {
    if (!s) return '#858796';
    if (s.includes('IV')) return '#e74a3b';
    if (s.includes('III')) return '#fd7e14';
    if (s.includes('II')) return '#f6c23e';
    if (s.includes('I')) return '#1cc88a';
    return '#858796';
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-ribbon"></i> Oncology Records</h2>
        {canCreateOncologyRecord && <Link to="/oncology/add" className="btn btn-primary"><i className="fas fa-plus"></i> Add Record</Link>}
      </div>

      <form className="card" style={{ marginBottom: 16 }} onSubmit={handleFilterSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Patient Search</label>
            <input value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} placeholder="Search by patient name, MRN, email, or phone" />
          </div>
          <div className="form-group">
            <label>Allowed Cancer Scope</label>
            <select value={cancerFilter} onChange={(e) => { setCancerFilter(e.target.value); setPage(1); }}>
              <option value="">All supported cancers</option>
              {FOUR_CANCERS.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div className="detail-field full-width">
            <label className="section-label">Cancer Scope</label>
            <p className="section-help">Supported cancer types: Breast, Prostate, Lung, and Colorectal. Use the filter above to narrow records by diagnosis.</p>
          </div>
          <div className="form-actions" style={{ gridColumn: '1 / -1', justifyContent: 'flex-start' }}>
            <button type="submit" className="btn btn-primary"><i className="fas fa-search"></i> Apply Filters</button>
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
          </div>
        </div>
      </form>

      <div className="result-count">{count} record(s)</div>
      <div className="card premium-table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Diagnosis Confirmed</th>
              <th>Cancer Type</th>
              <th>Stage</th>
              <th>AI Confidence</th>
              <th>Diagnosis Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r: any) => (
              <tr key={r.id}>
                <td><Link to={`/patients/${r.patient_id || r.patient?.id}`}>{r.patient ? `${r.patient.first_name} ${r.patient.last_name}` : `Patient #${r.patient_id}`}</Link></td>
                <td><span className={`badge ${r.diagnosis_confirmed ? 'badge-success' : 'badge-warning'}`}>{r.diagnosis_confirmed ? 'YES' : 'PENDING'}</span></td>
                <td><strong>{r.cancer_type}</strong></td>
                <td><span className="badge" style={{ backgroundColor: stageColor(r.clinical_stage) }}>{r.clinical_stage || 'N/A'}</span></td>
                <td>{r.ai_confidence_score ? `${r.ai_confidence_score}%` : '-'}</td>
                <td>{r.diagnosis_date || '-'}</td>
                <td className="actions">
                  <Link to={`/oncology/${r.id}`} className="btn btn-sm btn-info" title="View"><i className="fas fa-eye"></i></Link>
                  {canEditOncologyRecord && <Link to={`/oncology/${r.id}/edit`} className="btn btn-sm btn-warning" title="Edit"><i className="fas fa-edit"></i></Link>}
                  {canDeleteOncologyRecord && <button onClick={() => handleDelete(r.id)} className="btn btn-sm btn-danger" title="Delete"><i className="fas fa-trash"></i></button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="text-center">No oncology records</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-sm">Prev</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
            <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-sm">Next</button>
        </div>
      )}
    </div>
  );
}
