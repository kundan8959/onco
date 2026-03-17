import { useAuth } from '../context/AuthContext';

export type Role = 'superadmin' | 'hospital' | 'patient';

/**
 * Centralised role-based permission hook.
 *
 * Permission matrix:
 * ┌───────────────────────┬────────────┬──────────┬─────────┐
 * │ Capability            │ superadmin │ hospital │ patient │
 * ├───────────────────────┼────────────┼──────────┼─────────┤
 * │ Manage patients CRUD  │     ✗      │    ✓     │   ✗     │
 * │ Manage clinical data  │     ✗      │    ✓     │   ✗     │
 * │ View clinical data    │     ✗      │    ✓     │   ✓     │
 * │ Manage oncology CRUD  │     ✗      │    ✓     │   ✗     │
 * │ Manage treatments     │     ✗      │    ✓     │   ✗     │
 * │ Manage payer          │     ✗      │    ✓     │   ✗     │
 * │ Report symptoms       │     ✗      │    ✓     │   ✓     │
 * │ Upload documents      │     ✗      │    ✓     │   ✓     │
 * │ Admin users/hospitals │     ✓      │    ✗     │   ✗     │
 * └───────────────────────┴────────────┴──────────┴─────────┘
 */
export function usePermissions() {
  const { user } = useAuth();
  const role: Role | null = (user?.role as Role) ?? null;

  const isSuperadmin = role === 'superadmin';
  const isHospital = role === 'hospital';
  const isPatient = role === 'patient';

  return {
    role,
    isSuperadmin,
    isHospital,
    isPatient,

    // --- Patient management ---
    canCreatePatient: isHospital,
    canEditPatient: isHospital,
    canDeletePatient: isHospital,

    // --- Clinical data (allergies, vitals, medications, conditions, lifestyle, history) ---
    canCreateClinicalData: isHospital,
    canEditClinicalData: isHospital,
    canDeleteClinicalData: isHospital,

    // --- Oncology records ---
    canCreateOncologyRecord: isHospital,
    canEditOncologyRecord: isHospital,
    canDeleteOncologyRecord: isHospital,

    // --- Treatment planning ---
    canCreateTreatment: isHospital,
    canEditTreatment: isHospital,
    canDeleteTreatment: isHospital,
    canManageTreatmentActions: isHospital, // reschedule, delay, complete, readiness

    // --- Follow-ups ---
    canCreateFollowup: isHospital,
    canEditFollowup: isHospital,
    canDeleteFollowup: isHospital,

    // --- Symptom reports —  hospital can fully manage, patient can create ---
    canCreateSymptom: isHospital || isPatient,
    canEditSymptom: isHospital,
    canDeleteSymptom: isHospital,
    canManageSymptomActions: isHospital, // escalate, mark resolving

    // --- Payer submissions ---
    canCreatePayer: isHospital,
    canEditPayer: isHospital,
    canDeletePayer: isHospital,
    canManagePayerActions: isHospital, // approve, deny

    // --- Imaging / Documents ---
    canUploadDocument: isHospital || isPatient,
    canManageImaging: isHospital, // full AI analysis, approve, reject etc.

    // --- Admin ---
    canManageUsers: isSuperadmin,
    canManageHospitals: isSuperadmin,
  };
}
