import { useEffect, useState } from 'react';
import { patientsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useAppDispatch } from '../../store/hooks';
import { showNotice } from '../../store/uiSlice';

const STATE_CHOICES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
  'WI','WY','DC',
];

export default function PatientProfilePage() {
  const { user, patient: authPatient } = useAuth();
  const dispatch = useAppDispatch();
  const [patient, setPatient] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authPatient) {
      // Use the patient record from /me context directly
      setPatient(authPatient);
      setForm(authPatient);
      setLoading(false);
    } else {
      // Fallback: try to find patient by user email
      patientsApi.list({ search: user?.email, page_size: 1 })
        .then((r) => {
          const found = (r.data.results || r.data || [])[0];
          if (found) { setPatient(found); setForm(found); }
        })
        .finally(() => setLoading(false));
    }
  }, [authPatient, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    try {
      const res = await patientsApi.update(patient.id, {
        contact_number: form.contact_number,
        emergency_contact_name_relation: form.emergency_contact_name_relation,
        emergency_contact_phone: form.emergency_contact_phone,
        street_address: form.street_address,
        street_address_line2: form.street_address_line2,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        profession: form.profession,
        insurance_status: form.insurance_status,
      });
      setPatient(res.data);
      setForm(res.data);
      setEditing(false);
      dispatch(showNotice({ kind: 'success', text: 'Profile updated successfully.' }));
    } catch (err: any) {
      dispatch(showNotice({ kind: 'error', text: err.response?.data?.detail || 'Update failed.' }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}>Loading your profile…</div>;
  if (!patient) return <div style={{ padding: 32, textAlign: 'center' }}>Patient profile not found. Please contact your care team.</div>;

  return (
    <div>
      <div className="patient-hero-card">
        <div>
          <span className="eyebrow">My Account</span>
          <h1>My Profile</h1>
          <p>Your personal information, contact details, and insurance status.</p>
          <div className="hero-badge-row">
            <span className="hero-badge">MRN {patient.medical_record_number}</span>
            <span className="hero-badge">{patient.insurance_status === 'insured' ? '✓ Insured' : 'Non-Insured'}</span>
          </div>
        </div>
        <div className="hero-actions">
          {!editing && <button className="btn btn-warning" onClick={() => setEditing(true)}>Edit Profile</button>}
        </div>
      </div>

      {editing ? (
        <div className="card premium-form-card">
          <form onSubmit={handleSave} className="form-grid">
            <h3 className="section-title" style={{ gridColumn: '1/-1' }}>Contact Information</h3>
            <div className="form-group">
              <label>Phone Number</label>
              <input name="contact_number" value={form.contact_number || ''} onChange={handleChange} placeholder="+1XXXXXXXXXX" />
            </div>
            <div className="form-group">
              <label>Profession</label>
              <input name="profession" value={form.profession || ''} onChange={handleChange} />
            </div>

            <h3 className="section-title" style={{ gridColumn: '1/-1' }}>Address</h3>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Street Address</label>
              <input name="street_address" value={form.street_address || ''} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Apartment / Suite</label>
              <input name="street_address_line2" value={form.street_address_line2 || ''} onChange={handleChange} />
            </div>
            <div className="form-group"><label>City</label><input name="city" value={form.city || ''} onChange={handleChange} /></div>
            <div className="form-group">
              <label>State</label>
              <select name="state" value={form.state || ''} onChange={handleChange}>
                <option value="">--Select--</option>
                {STATE_CHOICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group"><label>ZIP Code</label><input name="zip_code" value={form.zip_code || ''} onChange={handleChange} /></div>

            <h3 className="section-title" style={{ gridColumn: '1/-1' }}>Emergency Contact</h3>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label>Name &amp; Relation (e.g., John Doe – Spouse)</label>
              <input name="emergency_contact_name_relation" value={form.emergency_contact_name_relation || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Emergency Phone</label>
              <input name="emergency_contact_phone" value={form.emergency_contact_phone || ''} onChange={handleChange} placeholder="+1XXXXXXXXXX" />
            </div>

            <h3 className="section-title" style={{ gridColumn: '1/-1' }}>Insurance</h3>
            <div className="form-group">
              <label>Insurance Status</label>
              <select name="insurance_status" value={form.insurance_status || 'non_insured'} onChange={handleChange}>
                <option value="non_insured">Non-Insured</option>
                <option value="insured">Insured</option>
              </select>
            </div>

            <div className="form-actions" style={{ gridColumn: '1/-1' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setEditing(false); setForm(patient); }}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="card">
          <div className="detail-grid">
            <div className="detail-field"><label>Full Name</label><span>{patient?.first_name} {patient?.last_name}</span></div>
            <div className="detail-field"><label>Date of Birth</label><span>{patient.date_of_birth}</span></div>
            <div className="detail-field"><label>Gender</label><span>{patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender_other || 'Other'}</span></div>
            <div className="detail-field"><label>Blood Group</label><span>{patient.blood_group || '—'}</span></div>
            <div className="detail-field"><label>Email</label><span>{patient.email || '—'}</span></div>
            <div className="detail-field"><label>Phone</label><span>{patient.contact_number || '—'}</span></div>
            <div className="detail-field"><label>Address</label><span>{[patient.street_address, patient.city, patient.state, patient.zip_code].filter(Boolean).join(', ') || '—'}</span></div>
            <div className="detail-field"><label>Emergency Contact</label><span>{patient.emergency_contact_name_relation || '—'}</span></div>
            <div className="detail-field"><label>Emergency Phone</label><span>{patient.emergency_contact_phone || '—'}</span></div>
            <div className="detail-field"><label>Insurance</label><span>{patient.insurance_status === 'insured' ? 'Insured' : 'Non-Insured'}</span></div>
            <div className="detail-field"><label>Profession</label><span>{patient.profession || '—'}</span></div>
            <div className="detail-field"><label>Registration Date</label><span>{patient.registration_date || '—'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
