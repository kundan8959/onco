import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { oncologyApi } from '../../api';

export default function OncologyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [payerSubmissions, setPayerSubmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('diagnosis-confirmed');

  useEffect(() => {
    if (!id) return;
    const rid = Number(id);
    oncologyApi.records.get(rid).then(r => {
      setRecord(r.data);
      setTreatments(r.data.treatments || []);
      setFollowups(r.data.followups || []);
      setSymptoms(r.data.symptom_reports || []);
      setPayerSubmissions(r.data.payer_submissions || []);
    });
  }, [id]);

  if (!record) return <div className="loading">Loading...</div>;

  const stageColor = (s: string) => {
    if (!s) return '#858796';
    if (s.includes('IV')) return '#e74a3b';
    if (s.includes('III')) return '#fd7e14';
    if (s.includes('II')) return '#f6c23e';
    if (s.includes('I')) return '#1cc88a';
    return '#858796';
  };

  const tabs = [
    { key: 'diagnosis-confirmed', label: 'Diagnosis Confirmed', icon: 'fa-microscope' },
    { key: 'treatment-planning', label: `Treatment Planning (${treatments.length})`, icon: 'fa-syringe' },
    { key: 'symptom-report', label: `Symptom Report (${symptoms.length})`, icon: 'fa-triangle-exclamation' },
    { key: 'payer-submission', label: `Payer Submission (${payerSubmissions.length})`, icon: 'fa-file-invoice-dollar' },
    { key: 'followups', label: `Follow-ups (${followups.length})`, icon: 'fa-calendar-check' },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <i className="fas fa-ribbon"></i> {record.cancer_type}
        </h2>
        <div>
          <Link to={`/patients/${record.patient_id || record.patient}`} className="btn btn-info">
            <i className="fas fa-user"></i> View Patient
          </Link>
          <Link to={`/oncology/${id}/edit`} className="btn btn-warning ml-2">
            <i className="fas fa-edit"></i> Edit
          </Link>
          <button onClick={() => { if (window.confirm('Delete?')) oncologyApi.records.delete(Number(id)).then(() => navigate('/oncology')); }} className="btn btn-danger ml-2">
            <i className="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>

      <div className="detail-summary">
        <div className="summary-item"><strong>Patient:</strong> {record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : `#${record.patient_id}`}</div>
        <div className="summary-item"><strong>Cancer Type:</strong> {record.cancer_type}</div>
        <div className="summary-item"><strong>Diagnosis Confirmed:</strong> {record.diagnosis_confirmed ? 'Yes' : 'No'}</div>
        <div className="summary-item"><strong>Clinical Stage:</strong> <span className="badge" style={{ backgroundColor: stageColor(record.clinical_stage) }}>{record.clinical_stage || 'N/A'}</span></div>
        <div className="summary-item"><strong>Diagnosis Date:</strong> {record.diagnosis_date || '-'}</div>
        <div className="summary-item"><strong>AI Confidence:</strong> {record.ai_confidence_score ? `${record.ai_confidence_score}%` : '-'}</div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content card">
        {activeTab === 'diagnosis-confirmed' && (
          <div className="detail-grid">
            <div className="detail-field"><label>Cancer Type</label><span>{record.cancer_type}</span></div>
            <div className="detail-field"><label>ICD-10 Code</label><span>{record.icd10_code || '-'}</span></div>
            <div className="detail-field"><label>Diagnosis Confirmed</label><span>{record.diagnosis_confirmed ? 'Yes' : 'No'}</span></div>
            <div className="detail-field"><label>Confirmed By</label><span>{record.confirmed_by || '-'}</span></div>
            <div className="detail-field"><label>Clinical Stage</label><span>{record.clinical_stage || '-'}</span></div>
            <div className="detail-field"><label>TNM Staging</label><span>{record.tnm_staging || '-'}</span></div>
            <div className="detail-field"><label>T Stage</label><span>{record.t_stage || '-'}</span></div>
            <div className="detail-field"><label>N Stage</label><span>{record.n_stage || '-'}</span></div>
            <div className="detail-field"><label>M Stage</label><span>{record.m_stage || '-'}</span></div>
            <div className="detail-field"><label>Histology Type</label><span>{record.histology_type || '-'}</span></div>
            <div className="detail-field"><label>Grade</label><span>{record.grade || '-'}</span></div>
            <div className="detail-field"><label>AI Confidence Score</label><span>{record.ai_confidence_score ? `${record.ai_confidence_score}%` : '-'}</span></div>
            <div className="detail-field full-width"><label>Pathology Report Notes</label><span>{record.pathology_report_notes || '-'}</span></div>
            <div className="detail-field full-width"><label>AI-Extracted Biomarkers</label><span>{record.biomarkers ? <pre className="json-display">{JSON.stringify(record.biomarkers, null, 2)}</pre> : 'No biomarker data'}</span></div>
          </div>
        )}

        {activeTab === 'treatment-planning' && (
          <div>
            <div className="detail-grid" style={{ marginBottom: 16 }}>
              <div className="detail-field"><label>Relevant Clinical Data</label><span>{record.clinical_notes || '-'}</span></div>
              <div className="detail-field"><label>Supporting Lab Results</label><span>{record.supporting_lab_results || '-'}</span></div>
              <div className="detail-field"><label>Imaging Findings</label><span>{record.imaging_findings || '-'}</span></div>
              <div className="detail-field"><label>ECOG Performance</label><span>{record.ecog_performance_status ?? '-'}</span></div>
              <div className="detail-field"><label>Treatment Intent</label><span>{record.treatment_intent || '-'}</span></div>
              <div className="detail-field"><label>Urgency Level</label><span>{record.urgency_level || '-'}</span></div>
              <div className="detail-field"><label>Recommended Surgery</label><span>{record.recommended_surgery || '-'}</span></div>
              <div className="detail-field"><label>Recommended Chemotherapy</label><span>{record.recommended_chemotherapy || '-'}</span></div>
              <div className="detail-field"><label>Recommended Radiation</label><span>{record.recommended_radiation || '-'}</span></div>
              <div className="detail-field"><label>Recommended Immunotherapy</label><span>{record.recommended_immunotherapy || '-'}</span></div>
              <div className="detail-field"><label>Recommended Targeted Therapy</label><span>{record.recommended_targeted_therapy || '-'}</span></div>
            </div>
            <div className="tab-header"><h3>Treatment Planning Entries</h3></div>
            <table className="table">
              <thead><tr><th>Type</th><th>Regimen</th><th>Start</th><th>End</th><th>Response</th><th>Notes</th></tr></thead>
              <tbody>
                {treatments.map((t: any) => (
                  <tr key={t.id}>
                    <td><strong>{t.treatment_type}</strong></td>
                    <td>{t.regimen_name || '-'}</td>
                    <td>{t.start_date || '-'}</td>
                    <td>{t.end_date || '-'}</td>
                    <td>{t.response || '-'}</td>
                    <td>{t.notes || '-'}</td>
                  </tr>
                ))}
                {treatments.length === 0 && <tr><td colSpan={6} className="text-center">No treatment planning entries recorded</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'symptom-report' && (
          <div>
            <div className="tab-header"><h3>Symptom Report</h3></div>
            <table className="table">
              <thead><tr><th>Symptom</th><th>Severity</th><th>Onset</th><th>Reported</th><th>Progression</th><th>Pain</th><th>Notes</th></tr></thead>
              <tbody>
                {symptoms.map((s: any) => (
                  <tr key={s.id}>
                    <td><strong>{s.symptom_name}</strong></td>
                    <td>{s.severity}</td>
                    <td>{s.onset_date || '-'}</td>
                    <td>{s.reported_date || '-'}</td>
                    <td>{s.progression || '-'}</td>
                    <td>{s.pain_score ?? '-'}</td>
                    <td>{s.notes || '-'}</td>
                  </tr>
                ))}
                {symptoms.length === 0 && <tr><td colSpan={7} className="text-center">No symptom reports recorded</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payer-submission' && (
          <div>
            <div className="tab-header"><h3>Payer Submission</h3></div>
            <table className="table">
              <thead><tr><th>Insurance Company</th><th>Policy</th><th>ICD-10</th><th>Auth Status</th><th>Claim Status</th><th>Billed</th><th>Approved</th></tr></thead>
              <tbody>
                {payerSubmissions.map((p: any) => (
                  <tr key={p.id}>
                    <td><strong>{p.insurance_company}</strong></td>
                    <td>{p.policy_number || '-'}</td>
                    <td>{p.icd10_diagnosis_code || '-'}</td>
                    <td>{p.authorization_status || '-'}</td>
                    <td>{p.claim_status || '-'}</td>
                    <td>{p.billed_amount || '-'}</td>
                    <td>{p.approved_amount || '-'}</td>
                  </tr>
                ))}
                {payerSubmissions.length === 0 && <tr><td colSpan={7} className="text-center">No payer submissions recorded</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'followups' && (
          <div>
            <div className="tab-header"><h3>Follow-ups</h3></div>
            <table className="table">
              <thead><tr><th>Date</th><th>Recurrence</th><th>Imaging Summary</th><th>Tumor Markers</th><th>Notes</th></tr></thead>
              <tbody>
                {followups.map((f: any) => (
                  <tr key={f.id}>
                    <td>{f.followup_date || '-'}</td>
                    <td><span className={`badge ${f.recurrence_detected ? 'badge-danger' : 'badge-success'}`}>{f.recurrence_detected ? 'YES' : 'NO'}</span></td>
                    <td>{f.imaging_summary || '-'}</td>
                    <td>{f.tumor_marker_summary || '-'}</td>
                    <td>{f.notes || '-'}</td>
                  </tr>
                ))}
                {followups.length === 0 && <tr><td colSpan={5} className="text-center">No follow-ups recorded</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
