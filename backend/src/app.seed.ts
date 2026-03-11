import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Allergy,
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
export class AppSeedService {
  constructor(
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Vitals) private vitalsRepo: Repository<Vitals>,
    @InjectRepository(OncologyRecord) private oncologyRepo: Repository<OncologyRecord>,
    @InjectRepository(OncologyTreatment) private treatmentRepo: Repository<OncologyTreatment>,
    @InjectRepository(OncologyFollowUp) private followupRepo: Repository<OncologyFollowUp>,
    @InjectRepository(OncologySymptomReport) private symptomRepo: Repository<OncologySymptomReport>,
    @InjectRepository(OncologyPayerSubmission) private payerRepo: Repository<OncologyPayerSubmission>,
    @InjectRepository(Allergy) private allergyRepo: Repository<Allergy>,
    @InjectRepository(Medication) private medicationRepo: Repository<Medication>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  private async backfillHospitalOwnership(defaultHospital = 'Apollo Oncology Center') {
    await this.patientRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.oncologyRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.vitalsRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.allergyRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.medicationRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.treatmentRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.followupRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.symptomRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.payerRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
  }

  async seed() {
    const patientCount = await this.patientRepo.count();
    const defaultHospital = 'Apollo Oncology Center';
    if (patientCount > 0) {
      await this.backfillHospitalOwnership(defaultHospital);
      return;
    }

    const patients = await this.patientRepo.save([
      this.patientRepo.create({
        medical_record_number: 'APL-2024-0042',
        first_name: 'Sarah',
        last_name: 'Mitchell',
        date_of_birth: '1982-03-15',
        gender: 'F',
        blood_group: 'A+',
        marital_status: 'married',
        email: 'sarah.mitchell@example.com',
        contact_number: '9876543210',
        emergency_contact_phone: '9876500001',
        emergency_contact_email: 'sunita.mitchell@example.com',
        emergency_contact_name_relation: 'Sunita - spouse',
        street_address: '12 Park Avenue',
        city: 'Mumbai',
        state: 'MH',
        zip_code: '400001',
        country: 'India',
        profession: 'Teacher',
        insurance_status: 'insured',
        hospital_name: defaultHospital,
        last_visit_date: '2026-03-08',
      }),
      this.patientRepo.create({
        medical_record_number: 'APL-2024-0087',
        first_name: 'James',
        last_name: 'Thompson',
        date_of_birth: '1959-08-20',
        gender: 'M',
        blood_group: 'B+',
        marital_status: 'married',
        email: 'james.thompson@example.com',
        contact_number: '9876543211',
        emergency_contact_phone: '9876500002',
        emergency_contact_email: 'maria.thompson@example.com',
        emergency_contact_name_relation: 'Maria - spouse',
        street_address: '44 Lake View',
        city: 'Mumbai',
        state: 'MH',
        zip_code: '400002',
        country: 'India',
        profession: 'Consultant',
        insurance_status: 'insured',
        hospital_name: defaultHospital,
        last_visit_date: '2026-03-09',
      }),
      this.patientRepo.create({
        medical_record_number: 'APL-2024-0104',
        first_name: 'Raj',
        last_name: 'Patel',
        date_of_birth: '1974-01-09',
        gender: 'M',
        blood_group: 'O+',
        marital_status: 'married',
        email: 'raj.patel@example.com',
        contact_number: '9876543212',
        emergency_contact_phone: '9876500003',
        emergency_contact_email: 'nina.patel@example.com',
        emergency_contact_name_relation: 'Nina - daughter',
        street_address: '9 Green Residency',
        city: 'Pune',
        state: 'MH',
        zip_code: '411001',
        country: 'India',
        profession: 'Engineer',
        insurance_status: 'insured',
        hospital_name: defaultHospital,
        last_visit_date: '2026-03-07',
      }),
    ]);

    await this.vitalsRepo.save([
      this.vitalsRepo.create({ patient_id: patients[0].id, hospital_name: defaultHospital, bp_systolic: 118, bp_diastolic: 76, diabetes: 96, spo2: 98, height: 165, weight: 62.5, recorded_date: new Date('2026-03-08T09:30:00Z') }),
      this.vitalsRepo.create({ patient_id: patients[1].id, hospital_name: defaultHospital, bp_systolic: 124, bp_diastolic: 82, diabetes: 108, spo2: 97, height: 174, weight: 78.2, recorded_date: new Date('2026-03-09T08:50:00Z') }),
      this.vitalsRepo.create({ patient_id: patients[2].id, hospital_name: defaultHospital, bp_systolic: 130, bp_diastolic: 84, diabetes: 114, spo2: 96, height: 171, weight: 74.8, recorded_date: new Date('2026-03-07T10:10:00Z') }),
    ]);

    await this.allergyRepo.save([
      this.allergyRepo.create({ patient_id: patients[0].id, hospital_name: defaultHospital, allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate' }),
      this.allergyRepo.create({ patient_id: patients[2].id, hospital_name: defaultHospital, allergen: 'NSAIDs', reaction: 'GI irritation', severity: 'mild' }),
    ]);

    await this.medicationRepo.save([
      this.medicationRepo.create({ patient_id: patients[0].id, hospital_name: defaultHospital, medicine_name: 'Trastuzumab', dosage: '6mg/kg', frequency: 'Every cycle', route: 'IV', reason: 'HER2+ breast cancer', start_date: '2026-01-20', is_active: true }),
      this.medicationRepo.create({ patient_id: patients[1].id, hospital_name: defaultHospital, medicine_name: 'Prednisone', dosage: '5mg', frequency: 'BID', route: 'PO', reason: 'Prostate cancer protocol', start_date: '2026-01-15', is_active: true }),
      this.medicationRepo.create({ patient_id: patients[2].id, hospital_name: defaultHospital, medicine_name: 'Ondansetron', dosage: '8mg', frequency: 'PRN', route: 'PO', reason: 'Anti-nausea', start_date: '2026-02-25', is_active: true }),
    ]);

    const records = await this.oncologyRepo.save([
      this.oncologyRepo.create({
        patient_id: patients[0].id,
        cancer_type: 'Breast Cancer',
        diagnosis_date: '2026-01-10',
        diagnosis_confirmed: true,
        hospital_name: defaultHospital,
        confirmed_by: 'hospital',
        ai_confidence_score: 96.4,
        t_stage: 'T2', n_stage: 'N0', m_stage: 'M0', clinical_stage: 'IIA', grade: 'II',
        histology_type: 'Invasive Ductal Carcinoma', tumor_size_cm: 2.4, lymph_node_involvement: false,
        biomarkers: { er: 'Positive', pr: 'Positive', her2: 'Positive', ki67: '38%' },
        recommended_surgery: 'Lumpectomy + sentinel node biopsy',
        recommended_chemotherapy: 'TCH protocol',
        recommended_targeted_therapy: 'Trastuzumab for 12 months',
        treatment_intent: 'curative', urgency_level: 'routine', status: 'active', is_primary: true,
      }),
      this.oncologyRepo.create({
        patient_id: patients[1].id,
        cancer_type: 'Prostate Cancer',
        diagnosis_date: '2026-01-15',
        diagnosis_confirmed: true,
        confirmed_by: 'hospital',
        ai_confidence_score: 94.8,
        t_stage: 'T3a', n_stage: 'N0', m_stage: 'M0', clinical_stage: 'High Risk', grade: '3',
        histology_type: 'Adenocarcinoma', tumor_size_cm: 3.1, lymph_node_involvement: false,
        biomarkers: { psa: '22.4', gleason: '4+3=7' },
        recommended_chemotherapy: 'Docetaxel + Prednisone',
        recommended_targeted_therapy: 'ADT Leuprolide',
        treatment_intent: 'disease-control', urgency_level: 'semi_urgent', status: 'active', is_primary: true,
      }),
      this.oncologyRepo.create({
        patient_id: patients[2].id,
        cancer_type: 'Colorectal Cancer',
        diagnosis_date: '2026-02-21',
        diagnosis_confirmed: true,
        confirmed_by: 'hospital',
        ai_confidence_score: 91.3,
        t_stage: 'T3', n_stage: 'N1', m_stage: 'M0', clinical_stage: 'IIIB', grade: 'II',
        histology_type: 'Adenocarcinoma', tumor_size_cm: 4.0, lymph_node_involvement: true,
        biomarkers: { cea: '9.4', kras: 'wild-type' },
        recommended_chemotherapy: 'FOLFOX',
        treatment_intent: 'adjuvant', urgency_level: 'routine', status: 'active', is_primary: true,
      }),
    ]);

    await this.treatmentRepo.save([
      this.treatmentRepo.create({ oncology_record_id: records[0].id, hospital_name: defaultHospital, treatment_type: 'chemotherapy', regimen_name: 'TCH', start_date: '2026-01-20', response: 'improving', notes: 'Cycle 6 of 8 complete' }),
      this.treatmentRepo.create({ oncology_record_id: records[1].id, hospital_name: defaultHospital, treatment_type: 'chemotherapy', regimen_name: 'Docetaxel + Prednisone', start_date: '2026-01-15', response: 'stable', notes: 'Cycle 3 of 6 complete' }),
      this.treatmentRepo.create({ oncology_record_id: records[2].id, hospital_name: defaultHospital, treatment_type: 'chemotherapy', regimen_name: 'FOLFOX', start_date: '2026-02-25', response: 'monitoring', notes: 'Cycle 2 of 8 complete' }),
    ]);

    await this.followupRepo.save([
      this.followupRepo.create({ oncology_record_id: records[0].id, hospital_name: defaultHospital, followup_date: '2026-03-12', recurrence_detected: false, imaging_summary: 'No metastatic spread on follow-up imaging', tumor_marker_summary: 'Stable markers', notes: 'Pre-cycle assessment cleared' }),
      this.followupRepo.create({ oncology_record_id: records[1].id, hospital_name: defaultHospital, followup_date: '2026-03-14', recurrence_detected: false, imaging_summary: 'Stable disease', tumor_marker_summary: 'PSA trending down', notes: 'Continue current regimen' }),
      this.followupRepo.create({ oncology_record_id: records[2].id, hospital_name: defaultHospital, followup_date: '2026-03-16', recurrence_detected: false, imaging_summary: 'Post-op review pending', tumor_marker_summary: 'CEA mildly elevated', notes: 'Monitor tolerance closely' }),
    ]);

    await this.symptomRepo.save([
      this.symptomRepo.create({ oncology_record_id: records[0].id, hospital_name: defaultHospital, symptom_name: 'Fatigue', severity: 'moderate', onset_date: '2026-03-06', progression: 'stable', pain_score: 3, notes: 'Expected post-chemo fatigue', reported_date: '2026-03-08' }),
      this.symptomRepo.create({ oncology_record_id: records[1].id, hospital_name: defaultHospital, symptom_name: 'Peripheral neuropathy', severity: 'mild', onset_date: '2026-03-02', progression: 'improving', pain_score: 2, notes: 'Improved after dose adjustment', reported_date: '2026-03-09' }),
      this.symptomRepo.create({ oncology_record_id: records[2].id, hospital_name: defaultHospital, symptom_name: 'Fever', severity: 'severe', onset_date: '2026-03-07', progression: 'progressing', pain_score: 6, notes: 'Needs urgent clinical review', reported_date: '2026-03-07' }),
    ]);

    await this.payerRepo.save([
      this.payerRepo.create({ oncology_record_id: records[0].id, hospital_name: defaultHospital, insurance_company: 'HDFC Ergo', policy_number: 'HDFC-APL-4201', primary_or_secondary: 'primary', icd10_diagnosis_code: 'C50.9', cpt_codes: ['96413'], hcpcs_codes: ['J9355'], prior_authorization_required: true, authorization_status: 'approved', authorization_number: 'AUTH-24031', claim_type: 'chemotherapy', claim_status: 'approved', claim_number: 'CLM-9001', submission_date: '2026-03-05', billed_amount: 185000, approved_amount: 172500 }),
      this.payerRepo.create({ oncology_record_id: records[1].id, hospital_name: defaultHospital, insurance_company: 'ICICI Lombard', policy_number: 'ICICI-PR-2044', primary_or_secondary: 'primary', icd10_diagnosis_code: 'C61', cpt_codes: ['96402'], hcpcs_codes: ['J9171'], prior_authorization_required: true, authorization_status: 'approved', authorization_number: 'AUTH-24032', claim_type: 'chemotherapy', claim_status: 'approved', claim_number: 'CLM-9002', submission_date: '2026-03-06', billed_amount: 132000, approved_amount: 120000 }),
      this.payerRepo.create({ oncology_record_id: records[2].id, hospital_name: defaultHospital, insurance_company: 'Star Health', policy_number: 'STAR-CO-8821', primary_or_secondary: 'primary', icd10_diagnosis_code: 'C18.9', cpt_codes: ['96523'], hcpcs_codes: ['J9263'], prior_authorization_required: true, authorization_status: 'pending', claim_type: 'chemotherapy', claim_status: 'submitted', claim_number: 'CLM-9003', submission_date: '2026-03-08', billed_amount: 148000, approved_amount: 0 }),
    ]);

    const hospitalUser = await this.userRepo.findOne({ where: { username: 'hospital' } });
    if (hospitalUser && !hospitalUser.hospital_name) {
      hospitalUser.hospital_name = 'Apollo Oncology Center';
      await this.userRepo.save(hospitalUser);
    }

    await this.patientRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.oncologyRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.vitalsRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.allergyRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.medicationRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.treatmentRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.followupRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.symptomRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();
    await this.payerRepo.createQueryBuilder().update().set({ hospital_name: defaultHospital }).where('hospital_name IS NULL').execute();

    console.log('Seeded demo oncology data');
  }
}
