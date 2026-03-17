import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { patientsApi, allergiesApi, vitalsApi, lifestyleApi, medicalHistoryApi, medicationsApi, conditionsApi } from '../../api';
import { usePermissions } from '../../hooks/usePermissions';

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canEditPatient, canDeletePatient } = usePermissions();
  const [patient, setPatient] = useState<any>(null);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [lifestyle, setLifestyle] = useState<any>(null);
  const [medHistory, setMedHistory] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!id) return;
    const pid = Number(id);
    patientsApi.get(pid).then(r => setPatient(r.data));
    allergiesApi.list({ patient_id: pid }).then(r => setAllergies(Array.isArray(r.data) ? r.data : r.data.results || []));
    vitalsApi.list({ patient_id: pid }).then(r => setVitals(Array.isArray(r.data) ? r.data : r.data.results || []));
    lifestyleApi.get(pid).then(r => setLifestyle(r.data)).catch(() => {});
    medicalHistoryApi.get(pid).then(r => setMedHistory(r.data)).catch(() => {});
    medicationsApi.list({ patient_id: pid }).then(r => setMedications(Array.isArray(r.data) ? r.data : r.data.results || []));
    conditionsApi.list({ patient_id: pid }).then(r => setConditions(Array.isArray(r.data) ? r.data : r.data.results || []));
  }, [id]);

  if (!patient) return <div className="loading">Loading...</div>;

  const genderLabel = (g: string) => g === 'M' ? 'Male' : g === 'F' ? 'Female' : patient.gender_other || 'Other';
  const maritalLabel = (s: string) => {
    const map: any = { single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed', separated: 'Separated' };
    return map[s] || s || '-';
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'fa-user' },
    { key: 'allergies', label: `Allergies (${allergies.length})`, icon: 'fa-allergies' },
    { key: 'vitals', label: `Vitals (${vitals.length})`, icon: 'fa-heartbeat' },
    { key: 'medications', label: `Medications (${medications.length})`, icon: 'fa-pills' },
    { key: 'conditions', label: `Conditions (${conditions.length})`, icon: 'fa-notes-medical' },
    { key: 'lifestyle', label: 'Lifestyle', icon: 'fa-running' },
    { key: 'history', label: 'Family History', icon: 'fa-dna' },
  ];

  const severityColor = (s: string) => {
    const map: any = { mild: '#1cc88a', moderate: '#f6c23e', severe: '#e74a3b', life_threatening: '#6f42c1' };
    return map[s] || '#858796';
  };

  return (
    <div>
      <div className="patient-hero-card">
        <div>
          <span className="eyebrow">Patient profile</span>
          <h1>{patient.full_name || `${patient.first_name} ${patient.last_name}`}</h1>
          {/* <p>Complete clinical profile including medications, vitals, allergies, chronic conditions, and care history.</p> */}
          <div className="hero-badge-row">
            <span className="hero-badge">MRN {patient.medical_record_number}</span>
            <span className="hero-badge">{patient.insurance_status === 'insured' ? 'Insured' : 'Non-Insured'}</span>
            <span className="hero-badge">{patient.is_active ? 'Active patient' : 'Inactive patient'}</span>
          </div>
        </div>
        <div className="hero-actions">
          {canEditPatient && <Link to={`/patients/${id}/edit`} className="btn btn-warning"><i className="fas fa-edit"></i> Edit</Link>}
          {canDeletePatient && <button onClick={() => { if (window.confirm('Delete?')) patientsApi.delete(Number(id)).then(() => navigate('/patients')); }} className="btn btn-danger ml-2">
            <i className="fas fa-trash"></i> Delete
          </button>}
        </div>
      </div>

      <div className="metric-grid patient-metric-grid">
        <div className="metric-card tone-blue"><span>Age</span><strong>{patient.age ? `${patient.age}y` : '-'}</strong></div>
        <div className="metric-card tone-purple"><span>Blood Group</span><strong>{patient.blood_group || '-'}</strong></div>
        <div className="metric-card tone-green"><span>Contact</span><strong>{patient.contact_number || '-'}</strong></div>
        <div className="metric-card tone-amber"><span>Insurance</span><strong>{patient.insurance_status === 'insured' ? 'Insured' : 'Non-Insured'}</strong></div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            <i className={`fas ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content card">
        {activeTab === 'overview' && (
          <div className="detail-grid">
            <div className="detail-field"><label>First Name</label><span>{patient.first_name}</span></div>
            <div className="detail-field"><label>Last Name</label><span>{patient.last_name}</span></div>
            <div className="detail-field"><label>Date of Birth</label><span>{patient.date_of_birth || '-'}</span></div>
            <div className="detail-field"><label>Gender</label><span>{genderLabel(patient.gender)}</span></div>
            <div className="detail-field"><label>Blood Group</label><span>{patient.blood_group || '-'}</span></div>
            <div className="detail-field"><label>Marital Status</label><span>{maritalLabel(patient.marital_status)}</span></div>
            <div className="detail-field"><label>Profession</label><span>{patient.profession || '-'}</span></div>
            <div className="detail-field"><label>Registration Date</label><span>{patient.registration_date || '-'}</span></div>
            <div className="detail-field"><label>Last Visit Date</label><span>{patient.last_visit_date || '-'}</span></div>
            <div className="detail-field"><label>Email</label><span>{patient.email || '-'}</span></div>
            <div className="detail-field"><label>Phone</label><span>{patient.contact_number || '-'}</span></div>
            <div className="detail-field full-width"><label>Address</label><span>{[patient.street_address, patient.street_address_line2, patient.city, patient.state, patient.zip_code, patient.country].filter(Boolean).join(', ') || '-'}</span></div>
            <div className="detail-field"><label>Emergency Contact</label><span>{patient.emergency_contact_name_relation || '-'}</span></div>
            <div className="detail-field"><label>Emergency Phone</label><span>{patient.emergency_contact_phone || '-'}</span></div>
            <div className="detail-field"><label>Emergency Email</label><span>{patient.emergency_contact_email || '-'}</span></div>
            <div className="detail-field"><label>Insurance Status</label><span>{patient.insurance_status === 'insured' ? 'Insured' : 'Non-Insured'}</span></div>
          </div>
        )}

        {activeTab === 'allergies' && (
          <div>
            <div className="tab-header"><h3>Allergies</h3></div>
            <table className="table">
              <thead><tr><th>Allergen</th><th>Reaction</th><th>Severity</th><th>Diagnosed Year</th><th>Notes</th></tr></thead>
              <tbody>
                {allergies.map((a: any) => (
                  <tr key={a.id}>
                    <td><strong>{a.allergen}</strong></td>
                    <td>{a.reaction || '-'}</td>
                    <td><span className="badge" style={{ backgroundColor: severityColor(a.severity) }}>{a.severity?.toUpperCase()}</span></td>
                    <td>{a.diagnosed_year || '-'}</td>
                    <td>{a.notes || '-'}</td>
                  </tr>
                ))}
                {allergies.length === 0 && <tr><td colSpan={5} className="text-center">No allergies recorded</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div>
            <div className="tab-header"><h3>Vitals History</h3></div>
            <table className="table">
              <thead><tr><th>Date</th><th>BP</th><th>Blood Sugar</th><th>SpO2</th><th>Height</th><th>Weight</th><th>BMI</th></tr></thead>
              <tbody>
                {vitals.map((v: any) => (
                  <tr key={v.id}>
                    <td>{v.recorded_date ? new Date(v.recorded_date).toLocaleDateString() : '-'}</td>
                    <td>{v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : '-'}</td>
                    <td>{v.diabetes != null ? `${v.diabetes} mg/dL` : '-'}</td>
                    <td>{v.spo2 != null ? `${v.spo2}%` : '-'}</td>
                    <td>{v.height ? `${v.height} cm` : '-'}</td>
                    <td>{v.weight ? `${v.weight} kg` : '-'}</td>
                    <td>{v.bmi ? Number(v.bmi).toFixed(1) : '-'}</td>
                  </tr>
                ))}
                {vitals.length === 0 && <tr><td colSpan={7} className="text-center">No vitals recorded</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'medications' && (
          <div>
            <div className="tab-header"><h3>Medications</h3></div>
            <table className="table">
              <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Route</th><th>Start</th><th>End</th><th>Prescribed By</th><th>Status</th></tr></thead>
              <tbody>
                {medications.map((m: any) => (
                  <tr key={m.id}>
                    <td><strong>{m.medicine_name}</strong></td>
                    <td>{m.dosage || '-'}</td>
                    <td>{m.frequency || '-'}</td>
                    <td>{m.route || '-'}</td>
                    <td>{m.start_date || '-'}</td>
                    <td>{m.end_date || '-'}</td>
                    <td>{m.prescribed_by || '-'}</td>
                    <td><span className={`badge ${m.is_active ? 'badge-success' : 'badge-secondary'}`}>{m.is_active ? 'ACTIVE' : 'STOPPED'}</span></td>
                  </tr>
                ))}
                {medications.length === 0 && <tr><td colSpan={8} className="text-center">No medications recorded</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'conditions' && (
          <div>
            <div className="tab-header"><h3>Chronic Conditions</h3></div>
            <table className="table">
              <thead><tr><th>Condition</th><th>Diagnosed Year</th><th>Status</th><th>Diagnosed By</th><th>Treatment</th><th>Notes</th></tr></thead>
              <tbody>
                {conditions.map((c: any) => (
                  <tr key={c.id}>
                    <td><strong>{c.condition === 'other' ? c.condition_name_other || 'Other' : c.condition}</strong></td>
                    <td>{c.diagnosed_year || '-'}</td>
                    <td><span className={`badge ${c.status === 'active' ? 'badge-danger' : c.status === 'controlled' ? 'badge-info' : c.status === 'in_remission' ? 'badge-warning' : 'badge-success'}`}>{c.status?.toUpperCase()}</span></td>
                    <td>{c.diagnosed_by || '-'}</td>
                    <td>{c.treatment || '-'}</td>
                    <td>{c.notes || '-'}</td>
                  </tr>
                ))}
                {conditions.length === 0 && <tr><td colSpan={6} className="text-center">No chronic conditions recorded</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'lifestyle' && (
          <div className="detail-grid">
            {lifestyle ? (
              <>
                <div className="detail-field"><label>Smoking Status</label><span>{lifestyle.smoking_status || '-'}</span></div>
                <div className="detail-field"><label>Smoking Quit Date</label><span>{lifestyle.smoking_quit_date || '-'}</span></div>
                <div className="detail-field"><label>Alcohol Use</label><span>{lifestyle.alcohol_use || '-'}</span></div>
                <div className="detail-field"><label>Physical Activity</label><span>{lifestyle.physical_activity || '-'}</span></div>
                <div className="detail-field"><label>Exercise Type</label><span>{lifestyle.exercise_type || '-'}</span></div>
                <div className="detail-field"><label>Diet Type</label><span>{lifestyle.diet_type || '-'}</span></div>
                <div className="detail-field"><label>Sleep Hours</label><span>{lifestyle.sleep_hours || '-'}</span></div>
                <div className="detail-field"><label>Sleep Quality</label><span>{lifestyle.sleep_quality || '-'}</span></div>
                <div className="detail-field"><label>Stress Level</label><span>{lifestyle.stress_level || '-'}</span></div>
                <div className="detail-field full-width"><label>Diet Notes</label><span>{lifestyle.diet_notes || '-'}</span></div>
                <div className="detail-field full-width"><label>Notes</label><span>{lifestyle.notes || '-'}</span></div>
              </>
            ) : <p className="text-center">No lifestyle data recorded</p>}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="detail-grid">
            {medHistory ? (
              <>
                <div className="detail-field"><label>Mother's Condition</label><span>{medHistory.mother_condition === 'other' ? medHistory.mother_condition_other || 'Other' : medHistory.mother_condition || '-'}</span></div>
                <div className="detail-field"><label>Father's Condition</label><span>{medHistory.father_condition === 'other' ? medHistory.father_condition_other || 'Other' : medHistory.father_condition || '-'}</span></div>
                <div className="detail-field full-width"><label>Additional Family History</label><span>{medHistory.additional_family_history || '-'}</span></div>
              </>
            ) : <p className="text-center">No family history recorded</p>}
          </div>
        )}
      </div>
    </div>
  );
}
