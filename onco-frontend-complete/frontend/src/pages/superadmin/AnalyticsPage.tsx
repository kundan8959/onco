import { useEffect, useMemo, useState } from 'react';
import { adminUsersApi, exportsApi, overviewApi } from '../../api';

type OverviewPayload = {
  metrics?: { label: string; value: string; tone?: string }[];
  trends?: {
    claimStatus?: Record<string, number>;
    comparison?: { label: string; records: number; confirmed: number; activeTreatment: number; avgAiConfidence: number }[];
  };
  table?: { title: string; columns: string[]; rows: string[][] };
};

export default function AnalyticsPage() {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [hospitalSlice, setHospitalSlice] = useState('all');
  const [hospitals, setHospitals] = useState<any[]>([]);

  useEffect(() => {
    overviewApi.getPage('superadmin/analytics', { fromDate, toDate, hospitalSlice }).then((r) => setData(r.data)).catch(() => setData(null));
    adminUsersApi.list({ role: 'hospital', page_size: 200 }).then((r) => setHospitals(r.data.results || [])).catch(() => setHospitals([]));
  }, [fromDate, toDate, hospitalSlice]);

  const rows = useMemo(() => {
    const source = data?.table?.rows || [];
    return source.filter((row) => {
      const matchesSearch = !search || row.join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesHospital = hospitalSlice === 'all' || true;
      const matchesDate = (!fromDate && !toDate) || true;
      return matchesSearch && matchesHospital && matchesDate;
    });
  }, [data, search, hospitalSlice, fromDate, toDate]);

  const exportCsv = async () => {
    const columns = data?.table?.columns || [];
    await exportsApi.queueAnalytics({
      columns,
      rows,
      filename: `superadmin-analytics-${Date.now()}.csv`,
      filters: { search, fromDate, toDate, hospitalSlice },
    });
    window.alert('Analytics export queued in background.');
  };

  const chartMax = Math.max(1, ...rows.map((row) => Number(row[1]) || 0));
  const approvalTrend = (data?.metrics || []).find((metric) => metric.label.toLowerCase().includes('approved'))?.value || '0';
  const claimTrend = data?.trends?.claimStatus || {};
  const comparison = data?.trends?.comparison || [];
  const comparisonMax = Math.max(1, ...comparison.map((item) => item.records || 0));

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-chart-column"></i> Analytics</h2>
        <button className="btn btn-primary" onClick={exportCsv}>Export CSV</button>
      </div>
      <div className="module-intro-card">
        <div>
          <span className="eyebrow">Insights</span>
          <h3>Platform Analytics</h3>
          <p>Filter by date range and hospital to review cohort trends, claim outcomes, and operational metrics. Export data for reporting.</p>
        </div>
        <div className="metric-chip-row">
          {(data?.metrics || []).map((metric) => (
            <span key={metric.label} className={`metric-chip ${metric.tone === 'green' ? 'success' : metric.tone === 'amber' ? 'warning' : metric.tone === 'red' ? 'danger' : 'info'}`}>
              {metric.label}: {metric.value}
            </span>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid">
          <div className="form-group"><label>Search cohort table</label><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cancer type, metric..." /></div>
          <div className="form-group"><label>From date</label><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
          <div className="form-group"><label>To date</label><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
          <div className="form-group"><label>Hospital slice</label><select value={hospitalSlice} onChange={(e) => setHospitalSlice(e.target.value)}><option value="all">All hospitals</option>{hospitals.map((h) => <option key={h.id} value={h.hospital_name || h.username}>{h.hospital_name || h.username}</option>)}</select></div>
        </div>
      </div>

      <div className="panel-grid analytics-grid-2">
        <div className="card">
          <div className="card-header"><h3>Cancer cohort volume</h3></div>
          <div className="chart-stack">
            {rows.map((row) => {
              const records = Number(row[1]) || 0;
              return (
                <div key={row[0]} className="chart-row">
                  <div className="chart-label">{row[0]}</div>
                  <div className="chart-bar-track"><div className="chart-bar-fill" style={{ width: `${(records / chartMax) * 100}%` }} /></div>
                  <div className="chart-value">{records}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h3>Approval trend block</h3></div>
          <div className="detail-summary patient-metric-grid">
            <div className="summary-item"><label className="section-label">Approved claims</label><strong>{approvalTrend}</strong></div>
            <div className="summary-item"><label className="section-label">Hospital slice</label><strong>{hospitalSlice === 'all' ? 'All hospitals' : hospitalSlice}</strong></div>
            <div className="summary-item"><label className="section-label">Date window</label><strong>{fromDate || toDate ? `${fromDate || '…'} → ${toDate || '…'}` : 'All time'}</strong></div>
            <div className="summary-item"><label className="section-label">Submitted claims</label><strong>{claimTrend.submitted || 0}</strong></div>
            <div className="summary-item"><label className="section-label">Denied claims</label><strong>{claimTrend.denied || 0}</strong></div>
            <div className="summary-item"><label className="section-label">Paid claims</label><strong>{claimTrend.paid || 0}</strong></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3>Cohort comparison chart</h3><span className="result-count">records vs confirmed vs active treatment</span></div>
        <div className="comparison-chart-grid">
          {comparison.map((item) => (
            <div key={item.label} className="comparison-card">
              <div className="comparison-card-title">{item.label}</div>
              <div className="comparison-bars">
                <div className="comparison-bar-row"><span>Records</span><div className="comparison-bar-track"><div className="comparison-bar-fill records" style={{ width: `${(item.records / comparisonMax) * 100}%` }} /></div><strong>{item.records}</strong></div>
                <div className="comparison-bar-row"><span>Confirmed</span><div className="comparison-bar-track"><div className="comparison-bar-fill confirmed" style={{ width: `${(item.confirmed / comparisonMax) * 100}%` }} /></div><strong>{item.confirmed}</strong></div>
                <div className="comparison-bar-row"><span>Active Tx</span><div className="comparison-bar-track"><div className="comparison-bar-fill treatment" style={{ width: `${(item.activeTreatment / comparisonMax) * 100}%` }} /></div><strong>{item.activeTreatment}</strong></div>
                <div className="comparison-bar-row"><span>Avg AI</span><div className="comparison-bar-track"><div className="comparison-bar-fill ai" style={{ width: `${item.avgAiConfidence}%` }} /></div><strong>{item.avgAiConfidence}%</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h3>Claim status chart</h3></div>
        <div className="claim-chart-grid">
          {Object.entries(claimTrend).map(([label, value]) => (
            <div key={label} className="claim-chart-card">
              <span className="claim-chart-label">{label}</span>
              <strong>{value}</strong>
              <div className="claim-chart-column-track"><div className="claim-chart-column-fill" style={{ height: `${Math.max(12, Number(value) * 18)}px` }} /></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card premium-table-card">
        <div className="card-header"><h3>{data?.table?.title || 'Analytics'}</h3><span className="result-count">{rows.length} cohort row{rows.length === 1 ? '' : 's'}</span></div>
        <table className="table">
          <thead><tr>{(data?.table?.columns || []).map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, idx) => (<tr key={idx}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>))}
            {rows.length === 0 && (<tr><td colSpan={data?.table?.columns?.length || 5} className="text-center">No analytics rows match the search</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
