import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patientsApi } from '../../api';

const GENDER_CHOICES = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
];

const BLOOD_GROUP_CHOICES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const MARITAL_STATUS_CHOICES = [
  { value: '', label: '--Select--' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
];

const INSURANCE_STATUS_CHOICES = [
  { value: 'non_insured', label: 'Non-Insured' },
  { value: 'insured', label: 'Insured' },
];

const STATE_CHOICES = [
  { value: '', label: '--Select State--' },
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }, { value: 'DC', label: 'District of Columbia' },
];

const emptyPatient = {
  medical_record_number: '',
  first_name: '', last_name: '', date_of_birth: '', gender: 'M', gender_other: '',
  blood_group: '', marital_status: '', email: '', contact_number: '',
  emergency_contact_phone: '', emergency_contact_email: '', emergency_contact_name_relation: '',
  street_address: '', street_address_line2: '', city: '', state: '', zip_code: '', country: 'USA',
  profession: '', insurance_status: 'non_insured', is_active: true,
};

const buildMrn = () => `MRN${Math.random().toString(36).slice(2, 12).toUpperCase()}`;

const buildCreatePayload = (form: any) => ({
  medical_record_number: form.medical_record_number?.trim() || buildMrn(),
  first_name: form.first_name,
  last_name: form.last_name,
  date_of_birth: form.date_of_birth,
  gender: form.gender,
  blood_group: form.blood_group,
  email: form.email || undefined,
  contact_number: form.contact_number,
  street_address: form.street_address,
  city: form.city,
  state: form.state,
  zip_code: form.zip_code,
  country: form.country || 'USA',
  insurance_status: form.insurance_status || 'non_insured',
});

const buildUpdatePayload = (form: any) => ({
  first_name: form.first_name,
  last_name: form.last_name,
  date_of_birth: form.date_of_birth,
  gender: form.gender,
  gender_other: form.gender_other || undefined,
  blood_group: form.blood_group,
  marital_status: form.marital_status || undefined,
  email: form.email || undefined,
  contact_number: form.contact_number,
  emergency_contact_phone: form.emergency_contact_phone || undefined,
  emergency_contact_email: form.emergency_contact_email || undefined,
  emergency_contact_name_relation: form.emergency_contact_name_relation || undefined,
  street_address: form.street_address,
  street_address_line2: form.street_address_line2 || undefined,
  city: form.city,
  state: form.state,
  zip_code: form.zip_code,
  country: form.country || 'USA',
  profession: form.profession || undefined,
  insurance_status: form.insurance_status || 'non_insured',
  is_active: form.is_active,
});

export default function PatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<any>(emptyPatient);
  const [errors, setErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      patientsApi.get(Number(id)).then(r => setForm(r.data));
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (isEdit) {
        await patientsApi.update(Number(id), buildUpdatePayload(form));
        navigate(`/patients/${id}`);
      } else {
        const res = await patientsApi.create(buildCreatePayload(form));
        navigate(`/patients/${res.data.id}`);
      }
    } catch (err: any) {
      if (err.response?.data) setErrors(err.response.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="patient-hero-card compact-hero-card">
        <div>
          <span className="eyebrow">Patient intake</span>
          <h1>{isEdit ? 'Edit Patient Profile' : 'New Patient Registration'}</h1>
          <p>Complete the patient profile below. All required fields are marked with an asterisk.</p>
        </div>
      </div>

      <div className="card premium-form-card">
        <form onSubmit={handleSubmit}>
          <h3 className="section-title">Personal Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input name="first_name" value={form.first_name} onChange={handleChange} required />
              {errors.first_name && <span className="field-error">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input name="last_name" value={form.last_name} onChange={handleChange} required />
              {errors.last_name && <span className="field-error">{errors.last_name}</span>}
            </div>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input name="date_of_birth" type="date" value={form.date_of_birth || ''} onChange={handleChange} required />
              {errors.date_of_birth && <span className="field-error">{errors.date_of_birth}</span>}
            </div>
            <div className="form-group">
              <label>Gender *</label>
              <select name="gender" value={form.gender} onChange={handleChange}>
                {GENDER_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            {form.gender === 'O' && (
              <div className="form-group">
                <label>Specify Gender *</label>
                <input name="gender_other" value={form.gender_other || ''} onChange={handleChange} placeholder="Please specify" />
                {errors.gender_other && <span className="field-error">{errors.gender_other}</span>}
              </div>
            )}
            <div className="form-group">
              <label>Blood Group *</label>
              <select name="blood_group" value={form.blood_group || ''} onChange={handleChange} required>
                <option value="">--Select--</option>
                {BLOOD_GROUP_CHOICES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {errors.blood_group && <span className="field-error">{errors.blood_group}</span>}
            </div>
            <div className="form-group">
              <label>Marital Status</label>
              <select name="marital_status" value={form.marital_status || ''} onChange={handleChange}>
                {MARITAL_STATUS_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Profession</label>
              <input name="profession" value={form.profession || ''} onChange={handleChange} placeholder="e.g., Engineer, Teacher" />
            </div>
          </div>

          <h3 className="section-title">Contact Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Email *</label>
              <input name="email" type="email" value={form.email || ''} onChange={handleChange} required />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input name="contact_number" value={form.contact_number || ''} onChange={handleChange} required placeholder="+1XXXXXXXXXX" />
              {errors.contact_number && <span className="field-error">{errors.contact_number}</span>}
            </div>
          </div>

          <h3 className="section-title">Address (USA)</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Street Address *</label>
              <input name="street_address" value={form.street_address || ''} onChange={handleChange} required placeholder="Street address line 1" />
              {errors.street_address && <span className="field-error">{errors.street_address}</span>}
            </div>
            <div className="form-group">
              <label>Street Address Line 2</label>
              <input name="street_address_line2" value={form.street_address_line2 || ''} onChange={handleChange} placeholder="Apartment, suite, unit, etc." />
            </div>
            <div className="form-group">
              <label>City *</label>
              <input name="city" value={form.city || ''} onChange={handleChange} required />
              {errors.city && <span className="field-error">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label>State *</label>
              <select name="state" value={form.state || ''} onChange={handleChange} required>
                {STATE_CHOICES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {errors.state && <span className="field-error">{errors.state}</span>}
            </div>
            <div className="form-group">
              <label>ZIP Code *</label>
              <input name="zip_code" value={form.zip_code || ''} onChange={handleChange} required placeholder="e.g., 12345 or 12345-6789" />
              {errors.zip_code && <span className="field-error">{errors.zip_code}</span>}
            </div>
            <div className="form-group">
              <label>Country</label>
              <input name="country" value={form.country || 'USA'} onChange={handleChange} />
            </div>
          </div>

          <h3 className="section-title">Emergency Contact</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Name &amp; Relation</label>
              <input name="emergency_contact_name_relation" value={form.emergency_contact_name_relation || ''} onChange={handleChange} placeholder="e.g., John Doe - Spouse" />
            </div>
            <div className="form-group">
              <label>Emergency Phone</label>
              <input name="emergency_contact_phone" value={form.emergency_contact_phone || ''} onChange={handleChange} placeholder="+1XXXXXXXXXX" />
            </div>
            <div className="form-group">
              <label>Emergency Contact Email</label>
              <input name="emergency_contact_email" type="email" value={form.emergency_contact_email || ''} onChange={handleChange} placeholder="emergency@example.com" />
            </div>
          </div>

          <h3 className="section-title">Insurance &amp; Status</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Insurance Status</label>
              <select name="insurance_status" value={form.insurance_status || 'non_insured'} onChange={handleChange}>
                {INSURANCE_STATUS_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
                Active Patient
              </label>
            </div>
          </div>

          {errors.non_field_errors && <div className="alert alert-danger">{errors.non_field_errors}</div>}
          {errors.detail && <div className="alert alert-danger">{errors.detail}</div>}
          {errors.message && <div className="alert alert-danger">{Array.isArray(errors.message) ? errors.message.join(', ') : errors.message}</div>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Patient' : 'Create Patient'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(isEdit ? `/patients/${id}` : '/patients')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
