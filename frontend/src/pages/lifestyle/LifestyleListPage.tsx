import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { lifestyleApi, patientsApi } from '../../api';
import CrudModal from '../../components/CrudModal';
import PatientSearchPicker from '../../components/PatientSearchPicker';

const emptyForm = {
  patient_id: '',
  smoking_status: 'never',
  smoking_quit_date: '',
  alcohol_use: 'never',
  physical_activity: 'sedentary',
  exercise_type: '',
  diet_type: 'regular',
  diet_notes: '',
  sleep_hours: '',
  sleep_quality: '',
  stress_level: '',
  notes: '',
};

export default function LifestyleListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await lifestyleApi.list();
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      const enriched = data.map((l: any) => ({
        ...l,
        patient_id: l.patient_id || l.patient?.id,
        patient_name: l.patient ? `${l.patient.first_name} ${l.patient.last_name}` : `Patient #${l.patient_id}`,
      }));
      setItems(enriched);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const smokingColor = (s: string) => {
    const map: any = { never: '#1cc88a', former: '#f6c23e', current: '#e74a3b', occasional: '#fd7e14' };
    return map[s] || '#858796';
  };

  const edit = async (l: any) => {
    setForm({ ...emptyForm, ...l, patient_id: l.patient_id || '' });
    setSelectedPatient(l.patient || (l.patient_id ? (await patientsApi.get(l.patient_id)).data : null));
    setOpen(true);
  };

  const reset = () => {
    setOpen(false);
    setForm(emptyForm);
    setSelectedPatient(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await lifestyleApi.upsert({ ...form, patient_id: Number(form.patient_id), sleep_hours: form.sleep_hours ? Number(form.sleep_hours) : null });
      reset();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title"><i className="fas fa-running"></i> Lifestyle Records</h2>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><i className="fas fa-plus"></i> Add / Update Lifestyle</button>
      </div>
      <div className="result-count">{items.length} record(s)</div>
      <div className="card">
        {loading ? <p className="text-center p-4">Loading...</p> : (
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Smoking</th>
                <th>Alcohol</th>
                <th>Physical Activity</th>
                <th>Diet</th>
                <th>Sleep (hrs)</th>
                <th>Stress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l: any) => (
                <tr key={l.patient_id}>
                  <td><Link to={`/patients/${l.patient_id}`}>{l.patient_name}</Link></td>
                  <td><span className="badge" style={{ backgroundColor: smokingColor(l.smoking_status) }}>{l.smoking_status?.toUpperCase() || '-'}</span></td>
                  <td>{l.alcohol_use || '-'}</td>
                  <td>{l.physical_activity || '-'}</td>
                  <td>{l.diet_type || '-'}</td>
                  <td>{l.sleep_hours || '-'}</td>
                  <td>{l.stress_level || '-'}</td>
                  <td><button className="btn btn-sm btn-warning" onClick={() => edit(l)}><i className="fas fa-edit"></i></button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={8} className="text-center">No lifestyle records</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <CrudModal open={open} title="Lifestyle Record" onClose={reset}>
        <form onSubmit={submit} className="form-grid">
          <PatientSearchPicker value={selectedPatient} onSelect={(patient) => { setSelectedPatient(patient); setForm({ ...form, patient_id: patient?.id || '' }); }} required />
          <div className="form-group"><label>Smoking Status</label><select value={form.smoking_status} onChange={(e) => setForm({ ...form, smoking_status: e.target.value })}><option value="never">Never</option><option value="former">Former</option><option value="current">Current</option><option value="occasional">Occasional</option></select></div>
          <div className="form-group"><label>Quit Date</label><input type="date" value={form.smoking_quit_date || ''} onChange={(e) => setForm({ ...form, smoking_quit_date: e.target.value })} /></div>
          <div className="form-group"><label>Alcohol Use</label><input value={form.alcohol_use || ''} onChange={(e) => setForm({ ...form, alcohol_use: e.target.value })} /></div>
          <div className="form-group"><label>Physical Activity</label><input value={form.physical_activity || ''} onChange={(e) => setForm({ ...form, physical_activity: e.target.value })} /></div>
          <div className="form-group"><label>Exercise Type</label><input value={form.exercise_type || ''} onChange={(e) => setForm({ ...form, exercise_type: e.target.value })} /></div>
          <div className="form-group"><label>Diet Type</label><input value={form.diet_type || ''} onChange={(e) => setForm({ ...form, diet_type: e.target.value })} /></div>
          <div className="form-group"><label>Sleep Hours</label><input type="number" step="0.1" value={form.sleep_hours || ''} onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })} /></div>
          <div className="form-group"><label>Sleep Quality</label><input value={form.sleep_quality || ''} onChange={(e) => setForm({ ...form, sleep_quality: e.target.value })} /></div>
          <div className="form-group"><label>Stress Level</label><input value={form.stress_level || ''} onChange={(e) => setForm({ ...form, stress_level: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Diet Notes</label><textarea value={form.diet_notes || ''} onChange={(e) => setForm({ ...form, diet_notes: e.target.value })} /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="form-actions" style={{ gridColumn: '1 / -1' }}><button className="btn btn-primary" disabled={saving || !form.patient_id}>{saving ? 'Saving...' : 'Save Lifestyle'}</button></div>
        </form>
      </CrudModal>
    </div>
  );
}
