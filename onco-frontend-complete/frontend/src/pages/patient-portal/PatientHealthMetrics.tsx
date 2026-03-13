import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vitalsApi, oncologyApi, patientsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function PatientHealthMetrics() {
  const { user, patient: authPatient } = useAuth();
  const [vitals, setVitals] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let patient = authPatient;
        if (!patient) {
          // Fallback: search by user email
          const pRes = await patientsApi.list({ search: user?.email, page_size: 1 });
          patient = (pRes.data.results || pRes.data || [])[0];
        }
        if (patient) {
          setPatientId(patient.id);
          const [vRes, sRes] = await Promise.all([
            vitalsApi.list({ patient_id: patient.id, page_size: 10 }),
            oncologyApi.symptoms.list({ patient_id: patient.id, page_size: 10 }),
          ]);
          setVitals(vRes.data.results || vRes.data || []);
          setSymptoms(sRes.data.results || sRes.data || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authPatient, user?.email]);

  if (loading) return <div className="loading">Loading metrics…</div>;

  const latest = vitals[0];

  const severityColor: Record<string, string> = {
    mild: '#1cc88a', moderate: '#f6c23e', severe: '#e74a3b', life_threatening: '#6f42c1',
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-heart-pulse"></i> My Health Metrics</h2>
        <p className="page-subtitle">Vitals history, symptoms, and treatment response over time</p>
      </div>

      {/* Latest Vitals Summary */}
      {latest && (
        <div className="metric-grid" style={{ marginBottom: 20 }}>
          {[
            { label: 'Blood Pressure', value: `${latest.bp_systolic}/${latest.bp_diastolic}`, unit: 'mmHg', tone: 'blue' },
            { label: 'Blood Sugar', value: latest.diabetes, unit: 'mg/dL', tone: 'amber' },
            { label: 'SpO2', value: `${latest.spo2}%`, unit: '', tone: 'green' },
            { label: 'Weight', value: `${latest.weight} kg`, unit: '', tone: 'purple' },
          ].map(m => (
            <div key={m.label} className={`metric-card tone-${m.tone}`}>
              <span>{m.label}</span>
              <strong>{m.value} <small style={{ fontWeight: 400, fontSize: 12 }}>{m.unit}</small></strong>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Vitals History */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}><i className="fas fa-heartbeat" style={{ marginRight: 8, color: '#e74a3b' }}></i>Vitals History</h3>
            <Link to="/vitals" className="btn btn-secondary" style={{ fontSize: 11 }}>View All</Link>
          </div>
          {vitals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#b7b9cc' }}>No vitals recorded.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>BP</th><th>Sugar</th><th>SpO2</th><th>BMI</th></tr>
                </thead>
                <tbody>
                  {vitals.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontSize: 12 }}>{new Date(v.recorded_date).toLocaleDateString()}</td>
                      <td>{v.bp_systolic}/{v.bp_diastolic}</td>
                      <td>{v.diabetes}</td>
                      <td>{v.spo2}%</td>
                      <td>{v.bmi || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Symptoms */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}><i className="fas fa-stethoscope" style={{ marginRight: 8, color: '#f6c23e' }}></i>Symptom Reports</h3>
            <Link to="/symptoms" className="btn btn-secondary" style={{ fontSize: 11 }}>View All</Link>
          </div>
          {symptoms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#b7b9cc' }}>No symptoms logged.</div>
          ) : (
            <div>
              {symptoms.slice(0, 6).map(s => (
                <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.symptom_name}</div>
                    <div style={{ fontSize: 11, color: '#858796' }}>{s.onset_date} · {s.progression}</div>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: `${severityColor[s.severity]}20`, color: severityColor[s.severity],
                  }}>
                    {s.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}><i className="fas fa-chart-line" style={{ marginRight: 8, color: '#4e73df' }}></i>Quick Links</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/vitals" className="btn btn-secondary"><i className="fas fa-heartbeat"></i> Log Vitals</Link>
          <Link to="/symptoms" className="btn btn-secondary"><i className="fas fa-stethoscope"></i> Report Symptom</Link>
          <Link to="/medications" className="btn btn-secondary"><i className="fas fa-pills"></i> My Medications</Link>
          <Link to="/allergies" className="btn btn-secondary"><i className="fas fa-allergies"></i> My Allergies</Link>
          <Link to="/conditions" className="btn btn-secondary"><i className="fas fa-notes-medical"></i> My Conditions</Link>
        </div>
      </div>
    </div>
  );
}
