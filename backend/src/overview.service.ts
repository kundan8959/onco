import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditLog,
  Medication,
  OncologyFollowUp,
  OncologyPayerSubmission,
  OncologyRecord,
  OncologySymptomReport,
  OncologyTreatment,
  Patient,
  User,
  Vitals,
} from './entities';

@Injectable()
export class OverviewService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Vitals) private vitalsRepo: Repository<Vitals>,
    @InjectRepository(OncologyRecord) private oncologyRepo: Repository<OncologyRecord>,
    @InjectRepository(OncologyTreatment) private treatmentRepo: Repository<OncologyTreatment>,
    @InjectRepository(Medication) private medicationRepo: Repository<Medication>,
    @InjectRepository(OncologyFollowUp) private followupRepo: Repository<OncologyFollowUp>,
    @InjectRepository(OncologySymptomReport) private symptomRepo: Repository<OncologySymptomReport>,
    @InjectRepository(OncologyPayerSubmission) private payerRepo: Repository<OncologyPayerSubmission>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async getPage(path: string, user: any, query: any = {}) {
    switch (path) {
      case 'superadmin/dashboard':
        return this.getSuperadminDashboard();
      case 'superadmin/hospitals':
        return this.getSuperadminHospitals();
      case 'superadmin/users':
        return this.getSuperadminUsers();
      case 'superadmin/analytics':
        return this.getSuperadminAnalytics(query);
      case 'superadmin/audit':
        return this.getSuperadminAudit();
      case 'hospital/dashboard':
        return this.getHospitalDashboard(user);
      case 'hospital/patients':
        return this.getHospitalPatients(user);
      case 'hospital/oncology-records':
        return this.getHospitalOncology(user);
      case 'hospital/ai-reports':
        return this.getHospitalAiReports(user);
      case 'hospital/treatment-plans':
        return this.getHospitalTreatmentPlans(user);
      case 'hospital/chemo-schedule':
        return this.getHospitalChemoSchedule(user);
      case 'hospital/medications':
        return this.getHospitalMedications(user);
      case 'hospital/er-tracking':
        return this.getHospitalErTracking(user);
      case 'hospital/analytics':
        return this.getHospitalAnalytics(user);
      case 'patient/dashboard':
        return this.getPatientDashboard(user);
      case 'patient/treatment-plan':
        return this.getPatientTreatmentPlan(user);
      case 'patient/chemo-schedule':
        return this.getPatientChemoSchedule(user);
      case 'patient/health-metrics':
        return this.getPatientHealthMetrics(user);
      case 'patient/documents':
        return this.getPatientDocuments(user);
      case 'patient/profile':
        return this.getPatientProfile(user);
      default:
        return null;
    }
  }

  private async loadCoreData(user?: any) {
    const hospitalScoped = user?.role === 'hospital' && user?.hospital_name;
    const patientWhere: any = { is_active: true };
    if (hospitalScoped) patientWhere.hospital_name = user.hospital_name;
    const commonWhere: any = hospitalScoped ? { hospital_name: user.hospital_name } : {};

    const [users, patients, records, treatments, medications, vitals, followups, symptoms, payer] = await Promise.all([
      this.userRepo.find({ order: { created_at: 'ASC' } }),
      this.patientRepo.find({ where: patientWhere, order: { created_at: 'DESC' } }),
      this.oncologyRepo.find({ where: commonWhere, order: { diagnosis_date: 'DESC' } }),
      this.treatmentRepo.find({ where: commonWhere, order: { created_at: 'DESC' } }),
      this.medicationRepo.find({ where: commonWhere, order: { created_at: 'DESC' } }),
      this.vitalsRepo.find({ where: commonWhere, order: { recorded_date: 'DESC' } }),
      this.followupRepo.find({ where: commonWhere, order: { followup_date: 'DESC' } }),
      this.symptomRepo.find({ where: commonWhere, order: { reported_date: 'DESC' } }),
      this.payerRepo.find({ where: commonWhere, order: { created_at: 'DESC' } }),
    ]);

    return { users, patients, records, treatments, medications, vitals, followups, symptoms, payer };
  }

  private async getPatientForUser(user: any) {
    if (!user) return null;
    const byEmail = user.email
      ? await this.patientRepo.findOne({ where: { email: user.email } })
      : null;
    if (byEmail) return byEmail;

    if (user.first_name || user.last_name) {
      const patients = await this.patientRepo.find({ where: { is_active: true } });
      const matched = patients.find((patient) => {
        const first = String(patient.first_name || '').toLowerCase();
        const last = String(patient.last_name || '').toLowerCase();
        return first === String(user.first_name || '').toLowerCase()
          && last === String(user.last_name || '').toLowerCase();
      });
      if (matched) return matched;
    }

    return this.patientRepo.findOne({ where: { is_active: true }, order: { created_at: 'ASC' } });
  }

  private formatDate(value?: string | Date | null) {
    if (!value) return '—';
    return new Date(value).toISOString().slice(0, 10);
  }

  private patientName(patient?: Patient | null) {
    return patient?.full_name || 'Unknown';
  }

  private async getSuperadminDashboard() {
    const { users, patients, records, treatments } = await this.loadCoreData();
    const hospitals = users.filter((u) => u.role === 'hospital');

    return {
      metrics: [
        { label: 'Total Hospitals', value: String(hospitals.length), tone: 'blue' },
        { label: 'Platform Users', value: String(users.length), tone: 'green' },
        { label: 'Active Patients', value: String(patients.length), tone: 'purple' },
        { label: 'Active Treatments', value: String(treatments.filter((t) => !t.end_date).length), tone: 'amber' },
      ],
      table: {
        title: 'Hospital Management',
        columns: ['Hospital', 'Account', 'Patients', 'Primary Cancers', 'Status'],
        rows: hospitals.map((hospital) => [
          hospital.hospital_name || hospital.username,
          hospital.username,
          String(patients.length),
          String(records.length),
          hospital.is_active ? 'Active' : 'Inactive',
        ]),
      },
    };
  }

  private async getSuperadminHospitals() {
    const { users, patients, records } = await this.loadCoreData();
    const hospitals = users.filter((u) => u.role === 'hospital');

    return {
      metrics: [
        { label: 'Active Tenants', value: String(hospitals.filter((h) => h.is_active).length), tone: 'green' },
        { label: 'Patient Records', value: String(patients.length), tone: 'blue' },
        { label: 'Cancer Records', value: String(records.length), tone: 'purple' },
        { label: 'Data Ready', value: hospitals.length ? 'Yes' : 'No', tone: 'amber' },
      ],
      table: {
        title: 'Hospitals',
        columns: ['Hospital', 'Username', 'Patients', 'Role', 'Status'],
        rows: hospitals.map((hospital) => [
          hospital.hospital_name || hospital.username,
          hospital.username,
          String(patients.length),
          hospital.role,
          hospital.is_active ? 'Active' : 'Inactive',
        ]),
      },
    };
  }

  private async getSuperadminUsers() {
    const { users } = await this.loadCoreData();

    return {
      metrics: [
        { label: 'Superadmins', value: String(users.filter((u) => u.role === 'superadmin').length), tone: 'blue' },
        { label: 'Hospitals', value: String(users.filter((u) => u.role === 'hospital').length), tone: 'green' },
        { label: 'Patients', value: String(users.filter((u) => u.role === 'patient').length), tone: 'purple' },
        { label: 'Active Accounts', value: String(users.filter((u) => u.is_active).length), tone: 'amber' },
      ],
      table: {
        title: 'Accounts',
        columns: ['Username', 'Role', 'Hospital', 'Email', 'Status'],
        rows: users.map((u) => [u.username, u.role, u.hospital_name || '—', u.email || '—', u.is_active ? 'Active' : 'Inactive']),
      },
    };
  }

  private async getSuperadminAnalytics(query: any = {}) {
    const { users, records, treatments, symptoms, payer } = await this.loadCoreData();
    const { fromDate, toDate, hospitalSlice } = query;

    const inRange = (value?: string | Date | null) => {
      if (!value) return true;
      const current = new Date(value).toISOString().slice(0, 10);
      if (fromDate && current < fromDate) return false;
      if (toDate && current > toDate) return false;
      return true;
    };

    const hospitalUsers = users.filter((u) => u.role === 'hospital');
    const hospitalNames = hospitalUsers.map((u) => u.hospital_name || u.username);
    const scopedRecords = records.filter((r) => inRange(r.diagnosis_date));
    const scopedTreatments = treatments.filter((t) => inRange(t.start_date));
    const scopedSymptoms = symptoms.filter((s) => inRange(s.reported_date || s.created_at));
    const scopedPayer = payer.filter((p) => inRange(p.submission_date || p.created_at));
    const aiAssisted = scopedRecords.filter((r) => Number(r.ai_confidence_score || 0) > 0);
    const urgentSymptoms = scopedSymptoms.filter((s) => ['severe', 'critical'].includes(String(s.severity).toLowerCase()));
    const approvedClaims = scopedPayer.filter((p) => Number(p.approved_amount || 0) > 0);

    const rows = [...new Set(scopedRecords.map((r) => r.cancer_type))].map((cancerType) => {
      const cancerScoped = scopedRecords.filter((r) => r.cancer_type === cancerType);
      const scopedIds = new Set(cancerScoped.map((r) => r.id));
      const cancerTreatments = scopedTreatments.filter((t) => scopedIds.has(t.oncology_record_id));
      const avgAi = cancerScoped.length
        ? Math.round(cancerScoped.reduce((sum, record) => sum + Number(record.ai_confidence_score || 0), 0) / cancerScoped.length)
        : 0;
      return [
        cancerType,
        String(cancerScoped.length),
        String(cancerScoped.filter((r) => r.diagnosis_confirmed).length),
        String(cancerTreatments.filter((t) => !t.end_date).length),
        `${avgAi}%`,
      ];
    });

    const comparison = rows.map((row) => ({
      label: row[0],
      records: Number(row[1]) || 0,
      confirmed: Number(row[2]) || 0,
      activeTreatment: Number(row[3]) || 0,
      avgAiConfidence: Number(String(row[4]).replace('%', '')) || 0,
    }));

    const claimTrend = scopedPayer.reduce((acc: Record<string, number>, item) => {
      const key = String(item.claim_status || 'unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      metrics: [
        { label: 'AI Accuracy', value: `${aiAssisted.length ? Math.round(aiAssisted.reduce((sum, r) => sum + Number(r.ai_confidence_score || 0), 0) / aiAssisted.length) : 0}%`, tone: 'green' },
        { label: 'Reports Analyzed', value: String(aiAssisted.length), tone: 'blue' },
        { label: 'ER-like Alerts', value: String(urgentSymptoms.length), tone: 'amber' },
        { label: 'Approved Claims', value: String(approvedClaims.length), tone: 'purple' },
        { label: 'Hospitals in Scope', value: hospitalSlice && hospitalSlice !== 'all' ? '1' : String(hospitalNames.length), tone: 'blue' },
      ],
      trends: {
        claimStatus: claimTrend,
        dateWindow: { fromDate: fromDate || null, toDate: toDate || null },
        hospitalSlice: hospitalSlice || 'all',
        comparison,
      },
      table: {
        title: 'Cancer Cohorts',
        columns: ['Cancer Type', 'Records', 'Confirmed', 'Active Treatment', 'Avg AI Confidence'],
        rows,
      },
    };
  }

  private async getSuperadminAudit() {
    const [auditLogs, records, payer] = await Promise.all([
      this.auditRepo.find({ order: { created_at: 'DESC' }, take: 50 }),
      this.oncologyRepo.find(),
      this.payerRepo.find(),
    ]);

    return {
      metrics: [
        { label: 'Events Logged', value: String(auditLogs.length), tone: 'blue' },
        { label: 'Inactive Actions', value: String(auditLogs.filter((log) => String(log.status).toLowerCase().includes('inactive')).length), tone: 'red' },
        { label: 'AI Approvals', value: String(records.filter((r) => r.diagnosis_confirmed).length), tone: 'green' },
        { label: 'Export-ready Rows', value: String(payer.length), tone: 'amber' },
      ],
      table: {
        title: 'Recent Events',
        columns: ['Timestamp', 'Actor', 'Event', 'Scope', 'Status'],
        rows: auditLogs.map((log) => [
          new Date(log.created_at).toISOString().replace('T', ' ').slice(0, 16),
          log.actor,
          `${log.action} ${log.entity_type}`,
          log.scope || 'Platform',
          String(log.status || 'ok').toUpperCase(),
        ]),
      },
    };
  }

  private async getHospitalDashboard(user: any) {
    const { patients, records, medications, symptoms } = await this.loadCoreData(user);
    const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

    return {
      metrics: [
        { label: 'Active Patients', value: String(patients.length), tone: 'blue' },
        { label: 'Oncology Records', value: String(records.length), tone: 'purple' },
        { label: 'Active Medications', value: String(medications.filter((m) => m.is_active).length), tone: 'green' },
        { label: 'Hospital', value: user?.hospital_name || 'Hospital Workspace', tone: 'amber' },
      ],
      table: {
        title: 'Recent Activity',
        columns: ['Patient', 'Cancer Type', 'Stage', 'Latest Visit', 'Status'],
        rows: records.slice(0, 5).map((record) => {
          const patient = patientMap.get(record.patient_id);
          return [
            this.patientName(patient),
            record.cancer_type,
            record.clinical_stage || '—',
            patient?.last_visit_date || '—',
            symptoms.find((s) => s.oncology_record_id === record.id)?.severity || record.status,
          ];
        }),
      },
    };
  }

  private async getHospitalPatients(user?: any) {
    const { patients, records, treatments } = await this.loadCoreData(user);
    const recordsByPatient = new Map(records.map((record) => [record.patient_id, record]));
    const treatmentByRecord = new Map(treatments.map((treatment) => [treatment.oncology_record_id, treatment]));

    return {
      metrics: [
        { label: 'Patients', value: String(patients.length), tone: 'blue' },
        { label: 'Breast Cases', value: String(records.filter((r) => r.cancer_type.toLowerCase().includes('breast')).length), tone: 'purple' },
        { label: 'Prostate Cases', value: String(records.filter((r) => r.cancer_type.toLowerCase().includes('prostate')).length), tone: 'green' },
        { label: 'Active Treatment', value: String(treatments.filter((t) => !t.end_date).length), tone: 'amber' },
      ],
      table: {
        title: 'Patient List',
        columns: ['Patient', 'MRN', 'Cancer Type', 'Protocol', 'Last Visit', 'Status'],
        rows: patients.map((patient) => {
          const record = recordsByPatient.get(patient.id);
          const treatment = record ? treatmentByRecord.get(record.id) : null;
          return [
            this.patientName(patient),
            patient.medical_record_number,
            record?.cancer_type || '—',
            treatment?.regimen_name || '—',
            patient.last_visit_date || '—',
            patient.is_active ? 'Active' : 'Inactive',
          ];
        }),
      },
    };
  }

  private async getHospitalOncology(user?: any) {
    const { records, treatments, patients } = await this.loadCoreData(user);
    const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
    const treatmentMap = new Map(treatments.map((treatment) => [treatment.oncology_record_id, treatment]));

    return {
      metrics: [
        { label: 'Records', value: String(records.length), tone: 'blue' },
        { label: 'Active Treatments', value: String(treatments.filter((t) => !t.end_date).length), tone: 'green' },
        { label: 'Confirmed Diagnoses', value: String(records.filter((r) => r.diagnosis_confirmed).length), tone: 'purple' },
        { label: 'AI-assisted Records', value: String(records.filter((r) => Number(r.ai_confidence_score || 0) > 0).length), tone: 'amber' },
      ],
      table: {
        title: 'Oncology Records',
        columns: ['Patient', 'Cancer Type', 'TNM', 'Clinical Stage', 'Plan'],
        rows: records.map((record) => [
          this.patientName(patientMap.get(record.patient_id)),
          record.cancer_type,
          record.tnm_staging,
          record.clinical_stage || '—',
          treatmentMap.get(record.id)?.regimen_name || record.recommended_chemotherapy || '—',
        ]),
      },
    };
  }

  private async getHospitalAiReports(user?: any) {
    const { records, payer, patients } = await this.loadCoreData(user);
    const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

    return {
      metrics: [
        { label: 'Reports Today', value: String(records.length), tone: 'blue' },
        { label: 'Awaiting Approval', value: String(records.filter((r) => !r.diagnosis_confirmed).length), tone: 'amber' },
        { label: 'Auto-created Records', value: String(records.filter((r) => Number(r.ai_confidence_score || 0) >= 90).length), tone: 'green' },
        { label: 'Failed Processing', value: '0', tone: 'red' },
      ],
      table: {
        title: 'AI Processing Queue',
        columns: ['Patient', 'Cancer Type', 'AI Confidence', 'Suggested Stage', 'Approval'],
        rows: records.map((record) => [
          this.patientName(patientMap.get(record.patient_id)),
          record.cancer_type,
          `${Number(record.ai_confidence_score || 0).toFixed(1)}%`,
          record.clinical_stage || '—',
          record.diagnosis_confirmed ? 'Approved' : 'Pending',
        ]).concat(
          payer.slice(0, 3).map((claim) => [claim.insurance_company, 'Payer Packet', '—', claim.authorization_status, claim.claim_status]),
        ),
      },
    };
  }

  private async getHospitalTreatmentPlans(user?: any) {
    const { records, treatments, patients, followups } = await this.loadCoreData(user);
    const patientMap = new Map(patients.map((patient) => [patient.id, patient]));
    const treatmentMap = new Map(treatments.map((treatment) => [treatment.oncology_record_id, treatment]));

    return {
      metrics: [
        { label: 'Plans in Progress', value: String(records.length), tone: 'blue' },
        { label: 'Roadmaps Generated', value: String(records.filter((r) => !!r.recommended_chemotherapy || !!r.recommended_targeted_therapy).length), tone: 'green' },
        { label: 'Urgent Reviews', value: String(records.filter((r) => r.urgency_level === 'urgent' || r.urgency_level === 'semi_urgent').length), tone: 'red' },
        { label: 'Follow-ups Planned', value: String(followups.length), tone: 'purple' },
      ],
      table: {
        title: 'Treatment Plans',
        columns: ['Patient', 'Cancer Type', 'Stage', 'Regimen', 'Intent'],
        rows: records.map((record) => [
          this.patientName(patientMap.get(record.patient_id)),
          record.cancer_type,
          record.clinical_stage || '—',
          treatmentMap.get(record.id)?.regimen_name || record.recommended_chemotherapy || '—',
          record.treatment_intent || '—',
        ]),
      },
    };
  }

  private async getHospitalChemoSchedule(user?: any) {
    const { records, treatments, patients, followups } = await this.loadCoreData(user);
    const recordMap = new Map(records.map((record) => [record.id, record]));
    const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

    return {
      metrics: [
        { label: 'Sessions Planned', value: String(treatments.length), tone: 'blue' },
        { label: 'Pre-Chemo Pending', value: String(followups.filter((f) => !f.recurrence_detected).length), tone: 'amber' },
        { label: 'Completed', value: String(treatments.filter((t) => !!t.end_date).length), tone: 'green' },
        { label: 'Delayed', value: String(treatments.filter((t) => String(t.response).toLowerCase() === 'monitoring').length), tone: 'red' },
      ],
      table: {
        title: 'Chemo Schedule',
        columns: ['Patient', 'Regimen', 'Start Date', 'Latest Follow-up', 'Status'],
        rows: treatments.map((treatment) => {
          const record = recordMap.get(treatment.oncology_record_id);
          const patient = record ? patientMap.get(record.patient_id) : null;
          const latestFollowup = followups.find((item) => item.oncology_record_id === treatment.oncology_record_id);
          return [
            this.patientName(patient),
            treatment.regimen_name || treatment.treatment_type,
            treatment.start_date,
            latestFollowup?.followup_date || '—',
            treatment.end_date ? 'Completed' : 'Scheduled',
          ];
        }),
      },
    };
  }

  private async getHospitalMedications(user?: any) {
    const { medications, patients } = await this.loadCoreData(user);
    const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

    return {
      metrics: [
        { label: 'Pending Verification', value: String(medications.filter((m) => m.data_source === 'ai').length), tone: 'amber' },
        { label: 'Ready to Dispense', value: String(medications.filter((m) => m.is_active).length), tone: 'green' },
        { label: 'Interaction Alerts', value: '0', tone: 'red' },
        { label: 'Dispensed Today', value: String(medications.length), tone: 'blue' },
      ],
      table: {
        title: 'Medication Queue',
        columns: ['Patient', 'Drug', 'Dose', 'Route', 'Status'],
        rows: medications.map((medication) => [
          this.patientName(patientMap.get(medication.patient_id)),
          medication.medicine_name,
          medication.dosage,
          medication.route || '—',
          medication.is_active ? 'Active' : 'Stopped',
        ]),
      },
    };
  }

  private async getHospitalErTracking(user?: any) {
    const { symptoms, records, patients } = await this.loadCoreData(user);
    const recordMap = new Map(records.map((record) => [record.id, record]));
    const patientMap = new Map(patients.map((patient) => [patient.id, patient]));

    return {
      metrics: [
        { label: 'ER Visits This Month', value: String(symptoms.length), tone: 'red' },
        { label: 'Critical Cases', value: String(symptoms.filter((s) => String(s.severity).toLowerCase() === 'severe').length), tone: 'amber' },
        { label: 'Post-Chemo Alerts', value: String(symptoms.filter((s) => ['progressing', 'worsening'].includes(String(s.progression).toLowerCase())).length), tone: 'purple' },
        { label: 'Resolved', value: String(symptoms.filter((s) => String(s.progression).toLowerCase() === 'improving').length), tone: 'green' },
      ],
      table: {
        title: 'Emergency / Symptom Events',
        columns: ['Patient', 'Reason', 'Severity', 'Progression', 'Cancer Type'],
        rows: symptoms.map((symptom) => {
          const record = recordMap.get(symptom.oncology_record_id);
          const patient = record ? patientMap.get(record.patient_id) : null;
          return [
            this.patientName(patient),
            symptom.symptom_name,
            symptom.severity,
            symptom.progression,
            record?.cancer_type || '—',
          ];
        }),
      },
    };
  }

  private async getHospitalAnalytics(user?: any) {
    const { records, treatments, symptoms, payer } = await this.loadCoreData(user);
    const totalTreatments = treatments.length || 1;
    const completed = treatments.filter((t) => !!t.end_date).length;
    const aiAssisted = records.filter((r) => Number(r.ai_confidence_score || 0) > 0);
    const avgAi = aiAssisted.length
      ? (aiAssisted.reduce((sum, item) => sum + Number(item.ai_confidence_score || 0), 0) / aiAssisted.length).toFixed(1)
      : '0.0';

    return {
      metrics: [
        { label: 'Chemo Completion', value: `${Math.round((completed / totalTreatments) * 100)}%`, tone: 'green' },
        { label: 'Missed / Delayed', value: String(treatments.filter((t) => String(t.response).toLowerCase() === 'monitoring').length), tone: 'amber' },
        { label: 'AI Extraction Accuracy', value: `${avgAi}%`, tone: 'purple' },
        { label: 'Payer Approvals', value: String(payer.filter((p) => String(p.claim_status).toLowerCase().includes('approved')).length), tone: 'blue' },
      ],
      table: {
        title: 'Operational Benchmarks',
        columns: ['Metric', 'Value', 'Source', 'Interpretation'],
        rows: [
          ['Confirmed diagnoses', String(records.filter((r) => r.diagnosis_confirmed).length), 'Oncology records', 'Good'],
          ['Active treatment courses', String(treatments.filter((t) => !t.end_date).length), 'Treatment plans', 'Operational load'],
          ['Symptom alerts', String(symptoms.length), 'ER / symptom tracking', 'Monitor closely'],
          ['Approved payer submissions', String(payer.filter((p) => Number(p.approved_amount || 0) > 0).length), 'Revenue cycle', 'Healthy'],
        ],
      },
    };
  }

  private async getPatientDashboard(user: any) {
    const patient = await this.getPatientForUser(user);
    if (!patient) return null;

    const [record, vitals, meds, treatments] = await Promise.all([
      this.oncologyRepo.findOne({ where: { patient_id: patient.id } }),
      this.vitalsRepo.find({ where: { patient_id: patient.id }, order: { recorded_date: 'DESC' } }),
      this.medicationRepo.find({ where: { patient_id: patient.id, is_active: true } }),
      this.treatmentRepo.find({
        where: { oncology_record_id: (await this.oncologyRepo.findOne({ where: { patient_id: patient.id } }))?.id || -1 },
        order: { start_date: 'ASC' },
      }),
    ]);

    return {
      metrics: [
        { label: 'Patient', value: patient.full_name, tone: 'blue' },
        { label: 'Cancer Type', value: record?.cancer_type || '—', tone: 'purple' },
        { label: 'Clinical Stage', value: record?.clinical_stage || '—', tone: 'amber' },
        { label: 'Active Medications', value: String(meds.length), tone: 'green' },
      ],
      table: {
        title: 'My Recent Health Data',
        columns: ['Recorded', 'BP', 'SpO2', 'Weight', 'Treatment'],
        rows: vitals.slice(0, 5).map((vital, index) => [
          this.formatDate(vital.recorded_date),
          `${vital.bp_systolic}/${vital.bp_diastolic}`,
          String(vital.spo2),
          String(vital.weight),
          treatments[index]?.regimen_name || '—',
        ]),
      },
    };
  }

  private async getPatientTreatmentPlan(user: any) {
    const patient = await this.getPatientForUser(user);
    if (!patient) return null;

    const record = await this.oncologyRepo.findOne({ where: { patient_id: patient.id } });
    if (!record) return null;
    const treatments = await this.treatmentRepo.find({ where: { oncology_record_id: record.id }, order: { start_date: 'ASC' } });

    return {
      metrics: [
        { label: 'Cancer Stage', value: record.clinical_stage || '—', tone: 'blue' },
        { label: 'Intent', value: record.treatment_intent || '—', tone: 'green' },
        { label: 'Active Plan Items', value: String(treatments.length), tone: 'purple' },
        { label: 'Urgency', value: record.urgency_level || 'routine', tone: 'amber' },
      ],
      table: {
        title: 'My Treatment Roadmap',
        columns: ['Type', 'Plan', 'Start', 'Response', 'Status'],
        rows: treatments.map((treatment) => [
          treatment.treatment_type,
          treatment.regimen_name || '—',
          treatment.start_date,
          treatment.response,
          treatment.end_date ? 'Completed' : 'Active',
        ]),
      },
    };
  }

  private async getPatientChemoSchedule(user: any) {
    const patient = await this.getPatientForUser(user);
    if (!patient) return null;

    const record = await this.oncologyRepo.findOne({ where: { patient_id: patient.id } });
    if (!record) return null;
    const [treatments, followups] = await Promise.all([
      this.treatmentRepo.find({ where: { oncology_record_id: record.id }, order: { start_date: 'ASC' } }),
      this.followupRepo.find({ where: { oncology_record_id: record.id }, order: { followup_date: 'ASC' } }),
    ]);

    return {
      metrics: [
        { label: 'Upcoming Sessions', value: String(followups.length), tone: 'blue' },
        { label: 'Completed', value: String(treatments.filter((t) => !!t.end_date).length), tone: 'green' },
        { label: 'Requirements Pending', value: String(treatments.filter((t) => !t.end_date).length), tone: 'amber' },
        { label: 'Missed Sessions', value: '0', tone: 'purple' },
      ],
      table: {
        title: 'My Schedule',
        columns: ['Regimen', 'Treatment Start', 'Follow-up', 'Response', 'Status'],
        rows: treatments.map((treatment, index) => [
          treatment.regimen_name || treatment.treatment_type,
          treatment.start_date,
          followups[index]?.followup_date || '—',
          treatment.response,
          treatment.end_date ? 'Completed' : 'Scheduled',
        ]),
      },
    };
  }

  private async getPatientHealthMetrics(user: any) {
    const patient = await this.getPatientForUser(user);
    if (!patient) return null;

    const [vitals, meds] = await Promise.all([
      this.vitalsRepo.find({ where: { patient_id: patient.id }, order: { recorded_date: 'DESC' } }),
      this.medicationRepo.find({ where: { patient_id: patient.id, is_active: true }, order: { created_at: 'DESC' } }),
    ]);
    const latest = vitals[0];

    return {
      metrics: [
        { label: 'Latest BP', value: latest ? `${latest.bp_systolic}/${latest.bp_diastolic}` : '—', tone: 'green' },
        { label: 'Latest SpO2', value: latest ? `${latest.spo2}%` : '—', tone: 'blue' },
        { label: 'Weight', value: latest ? `${latest.weight} kg` : '—', tone: 'purple' },
        { label: 'Active Meds', value: String(meds.length), tone: 'amber' },
      ],
      table: {
        title: 'Vitals Trend',
        columns: ['Recorded', 'BP', 'Sugar', 'SpO2', 'BMI'],
        rows: vitals.slice(0, 10).map((vital) => [
          this.formatDate(vital.recorded_date),
          `${vital.bp_systolic}/${vital.bp_diastolic}`,
          String(vital.diabetes),
          String(vital.spo2),
          String(vital.bmi || '—'),
        ]),
      },
    };
  }

  private async getPatientDocuments(user: any) {
    const patient = await this.getPatientForUser(user);
    if (!patient) return null;

    const record = await this.oncologyRepo.findOne({ where: { patient_id: patient.id } });
    const payer = record
      ? await this.payerRepo.find({ where: { oncology_record_id: record.id }, order: { created_at: 'DESC' } })
      : [];

    return {
      metrics: [
        { label: 'Reports Available', value: String((record ? 1 : 0) + payer.length), tone: 'blue' },
        { label: 'AI Summaries', value: record && Number(record.ai_confidence_score || 0) > 0 ? '1' : '0', tone: 'purple' },
        { label: 'Pending Processing', value: String(record && !record.diagnosis_confirmed ? 1 : 0), tone: 'amber' },
        { label: 'Ready to Download', value: String(payer.length + (record ? 1 : 0)), tone: 'green' },
      ],
      table: {
        title: 'My Reports & Documents',
        columns: ['Document', 'Date', 'Type', 'Status'],
        rows: [
          ...(record ? [[`${record.cancer_type} oncology summary`, record.diagnosis_date, 'AI Summary', record.diagnosis_confirmed ? 'Approved' : 'Pending']] : []),
          ...payer.map((claim) => [
            `${claim.insurance_company} authorization`,
            claim.submission_date || this.formatDate(claim.created_at),
            'Payer Submission',
            claim.claim_status,
          ]),
        ],
      },
    };
  }

  private async getPatientProfile(user: any) {
    const patient = await this.getPatientForUser(user);
    if (!patient) return null;

    return {
      metrics: [
        { label: 'Emergency Contact', value: patient.emergency_contact_name_relation || '—', tone: 'blue' },
        { label: 'Insurance Status', value: patient.insurance_status || '—', tone: 'green' },
        { label: 'City', value: patient.city || '—', tone: 'purple' },
        { label: 'Last Visit', value: patient.last_visit_date || '—', tone: 'amber' },
      ],
      table: {
        title: 'Profile Details',
        columns: ['Field', 'Value'],
        rows: [
          ['Full Name', patient.full_name],
          ['Email', patient.email],
          ['Contact Number', patient.contact_number],
          ['Address', `${patient.street_address}, ${patient.city}, ${patient.state}`],
          ['Blood Group', patient.blood_group],
          ['Profession', patient.profession || '—'],
        ],
      },
    };
  }
}
