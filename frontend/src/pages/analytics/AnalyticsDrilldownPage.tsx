import { useEffect, useState } from 'react';
import { overviewApi } from '../../api';

export default function AnalyticsDrilldownPage() {
  const [superadmin, setSuperadmin] = useState<any>(null);
  const [hospital, setHospital] = useState<any>(null);

  useEffect(() => {
    overviewApi.getPage('superadmin/analytics').then((r) => setSuperadmin(r.data)).catch(() => {});
    overviewApi.getPage('hospital/analytics').then((r) => setHospital(r.data)).catch(() => {});
  }, []);

  const blocks = [
    { title: 'Platform Analytics', data: superadmin },
    { title: 'Hospital Analytics', data: hospital },
  ];

  return (
    <div>
      <div className="page-header"><h2 className="page-title"><i className="fas fa-chart-line"></i> Analytics Drilldown</h2></div>
      <div className="panel-grid">
        {blocks.map((block) => (
          <section key={block.title} className="data-card">
            <div className="data-card-header">
              <div>
                <h3>{block.title}</h3>
                <p>Real overview metrics rendered in a drilldown-friendly layout.</p>
              </div>
            </div>
            <div className="metric-grid">
              {(block.data?.metrics || []).map((metric: any) => (
                <div key={metric.label} className={`metric-card tone-${metric.tone || 'blue'}`}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
