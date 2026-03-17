import { useEffect, useMemo, useState } from 'react';
import { patientsApi } from '../api';
import Loader from './Loader';

type Patient = any;

export default function PatientSearchPicker({
  value,
  onSelect,
  label = 'Patient',
  placeholder = 'Search by name, email, phone, or MRN',
  disabled = false,
  required = false,
}: {
  value?: Patient | null;
  onSelect: (patient: Patient | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!value) {
      setQuery('');
      return;
    }
    setQuery(formatPatientLabel(value));
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (!q || disabled || (value && q === formatPatientLabel(value))) {
      setOptions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await patientsApi.searchForPicker(q);
        setOptions(results);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, value, disabled]);

  const helper = useMemo(() => {
    if (!value) return 'Choose a patient using searchable details instead of an internal ID.';
    return [value.medical_record_number, value.email || value.contact_number, value.emergency_contact_phone]
      .filter(Boolean)
      .join(' · ');
  }, [value]);

  return (
    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
      <label>{label}</label>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSelect(null);
        }}
        placeholder={placeholder}
        disabled={disabled}
        required={required && !value}
      />
      <small className="field-help">{helper}</small>
      {loading && <Loader inline size="sm" label="Searching patients…" className="picker-loader" />}
      {options.length > 0 && (
        <div className="picker-list">
          {options.map((patient) => (
            <button type="button" key={patient.id} className="picker-item" onClick={() => { onSelect(patient); setOptions([]); }}>
              <strong>{patient.full_name || `${patient.first_name} ${patient.last_name}`}</strong>
              <span>{[patient.medical_record_number, patient.email || patient.contact_number, patient.emergency_contact_phone].filter(Boolean).join(' · ')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function formatPatientLabel(patient: Patient) {
  const name = patient?.full_name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();
  const mrn = patient?.medical_record_number ? ` (${patient.medical_record_number})` : '';
  return `${name}${mrn}`.trim();
}
