import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './HospitalSwitcher.css';

export default function HospitalSwitcher() {
  const { patient, patientRecords, setActivePatientById } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Only render when registered at more than one hospital
  if (patientRecords.length <= 1) return null;

  const handleSelect = (id: number) => {
    setActivePatientById(id);
    setOpen(false);
  };

  return (
    <div className="hospital-switcher" ref={ref}>
      <button
        className="hospital-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        title="Switch hospital context"
      >
        <i className="fas fa-hospital-user" />
        <span className="hospital-switcher-name">{patient?.hospital_name || 'Select Hospital'}</span>
        <i className={`fas fa-chevron-down hospital-switcher-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="hospital-switcher-dropdown">
          <div className="hospital-switcher-label">Your Hospitals</div>
          {patientRecords.map((rec) => (
            <button
              key={rec.id}
              className={`hospital-switcher-option ${rec.id === patient?.id ? 'active' : ''}`}
              onClick={() => handleSelect(rec.id)}
            >
              <span className="hospital-switcher-option-icon">
                <i className="fas fa-hospital" />
              </span>
              <span className="hospital-switcher-option-info">
                <span className="hospital-switcher-option-name">{rec.hospital_name}</span>
                <span className="hospital-switcher-option-mrn">MRN: {rec.medical_record_number}</span>
              </span>
              {rec.id === patient?.id && <i className="fas fa-check hospital-switcher-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
