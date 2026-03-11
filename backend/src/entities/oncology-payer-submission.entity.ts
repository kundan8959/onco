import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { OncologyRecord } from './oncology-record.entity';

@Entity('oncology_payer_submissions')
@Index(['oncology_record', 'claim_status'])
@Index(['authorization_status'])
@Index(['submission_date'])
export class OncologyPayerSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OncologyRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oncology_record_id' })
  oncology_record: OncologyRecord;

  @Column({ name: 'oncology_record_id' })
  oncology_record_id: number;

  @Column({ length: 200 })
  insurance_company: string;

  @Column({ length: 100 })
  policy_number: string;

  @Column({ length: 20, default: 'primary' })
  primary_or_secondary: string;

  @Column({ length: 10 })
  icd10_diagnosis_code: string;

  @Column({ type: 'jsonb', default: [] })
  cpt_codes: string[];

  @Column({ type: 'jsonb', default: [] })
  hcpcs_codes: string[];

  @Column({ default: false })
  prior_authorization_required: boolean;

  @Column({ length: 20, default: 'not_required' })
  authorization_status: string;

  @Column({ length: 100, nullable: true })
  authorization_number: string;

  @Column({ length: 20 })
  claim_type: string;

  @Column({ length: 30, default: 'draft' })
  claim_status: string;

  @Column({ length: 100, nullable: true })
  claim_number: string;

  @Column({ type: 'date', nullable: true })
  submission_date: string;

  @Column({ type: 'text', nullable: true })
  denial_reason: string;

  @Column({ default: false })
  resubmission_flag: boolean;

  @Column({ length: 100, nullable: true })
  original_claim_number: string;

  @Column({ length: 200, nullable: true })
  clearinghouse_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  billed_amount: number;

  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  approved_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
