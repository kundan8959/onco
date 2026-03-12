import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('oncology_records')
@Index(['patient', 'status'])
@Index(['diagnosis_confirmed', 'cancer_type'])
@Index(['clinical_stage'])
export class OncologyRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patient_id: number;

  // Diagnosis
  @Column({ length: 100 })
  cancer_type: string;

  @Column({ type: 'text', nullable: true })
  other_cancer_type_details: string;

  @Column({ length: 10, nullable: true })
  icd10_code: string;

  @Column({ type: 'date' })
  diagnosis_date: string;

  @Column({ default: false })
  diagnosis_confirmed: boolean;

  @Column({ length: 20, default: 'ai' })
  confirmed_by: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  ai_confidence_score: number;

  @Column({ type: 'text', nullable: true })
  pathology_report_notes: string;

  // Staging
  @Column({ length: 10, nullable: true })
  t_stage: string;

  @Column({ length: 10, nullable: true })
  n_stage: string;

  @Column({ length: 10, nullable: true })
  m_stage: string;

  @Column({ length: 10, nullable: true })
  clinical_stage: string;

  @Column({ length: 50, default: 'AJCC 8th Edition' })
  stage_grouping_version: string;

  // Tumor characteristics
  @Column({ length: 10, nullable: true })
  grade: string;

  @Column({ length: 200, nullable: true })
  histology_type: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  tumor_size_cm: number;

  @Column({ default: false })
  lymph_node_involvement: boolean;

  @Column({ default: false })
  metastasis_present: boolean;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  biomarkers: Record<string, any>;

  // Clinical assessment
  @Column({ type: 'int', nullable: true })
  ecog_performance_status: number;

  @Column({ type: 'text', nullable: true })
  comorbidities: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  baseline_vitals: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  supporting_lab_results: string;

  @Column({ type: 'text', nullable: true })
  imaging_findings: string;

  @Column({ type: 'text', nullable: true })
  clinical_notes: string;

  // Treatment roadmap
  @Column({ type: 'text', nullable: true })
  recommended_surgery: string;

  @Column({ type: 'text', nullable: true })
  recommended_chemotherapy: string;

  @Column({ type: 'text', nullable: true })
  recommended_radiation: string;

  @Column({ type: 'text', nullable: true })
  recommended_immunotherapy: string;

  @Column({ type: 'text', nullable: true })
  recommended_targeted_therapy: string;

  @Column({ length: 20, nullable: true })
  treatment_intent: string;

  @Column({ length: 20, nullable: true })
  urgency_level: string;

  @Column({ type: 'timestamp', nullable: true })
  roadmap_generated_at: Date;

  // Status
  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ default: true })
  is_primary: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  get tnm_staging(): string {
    if (this.t_stage && this.n_stage && this.m_stage) {
      return `${this.t_stage}${this.n_stage}${this.m_stage}`;
    }
    return 'Not staged';
  }
}
