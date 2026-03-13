import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { OncologyRecord } from './oncology-record.entity';
import { OncologyTreatment } from './oncology-treatment.entity';

export const EPISODE_TYPES = [
  'chemotherapy',
  'radiation',
  'immunotherapy',
  'targeted_therapy',
  'surgery',
  'consultation',
  'follow_up',
] as const;

export const EPISODE_STATUSES = [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'missed',
  'postponed',
] as const;

export type EpisodeType = typeof EPISODE_TYPES[number];
export type EpisodeStatus = typeof EPISODE_STATUSES[number];

@Entity('treatment_episodes')
@Index(['oncology_record_id'])
@Index(['patient_id'])
@Index(['scheduled_date'])
@Index(['status'])
@Index(['hospital_name'])
export class TreatmentEpisode {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OncologyRecord, { onDelete: 'CASCADE', eager: false })
  @JoinColumn({ name: 'oncology_record_id' })
  oncology_record: OncologyRecord;

  @Column({ name: 'oncology_record_id' })
  oncology_record_id: number;

  @ManyToOne(() => OncologyTreatment, { onDelete: 'SET NULL', nullable: true, eager: false })
  @JoinColumn({ name: 'oncology_treatment_id' })
  oncology_treatment: OncologyTreatment | null;

  @Column({ name: 'oncology_treatment_id', nullable: true })
  oncology_treatment_id: number | null;

  /** Denormalized from the oncology record for fast querying */
  @Column({ name: 'patient_id' })
  patient_id: number;

  /** chemotherapy | radiation | immunotherapy | targeted_therapy | surgery | consultation | follow_up */
  @Column({ length: 50 })
  episode_type: string;

  /** Breast Cancer | Prostate Cancer | Lung Cancer | Colorectal Cancer */
  @Column({ length: 100, nullable: true })
  cancer_type: string;

  @Column({ type: 'date' })
  scheduled_date: string;

  /** 24-hour format, e.g. "09:30" */
  @Column({ length: 10, nullable: true })
  scheduled_time: string;

  /** Approximate duration in minutes */
  @Column({ type: 'int', nullable: true })
  duration_minutes: number;

  /** Ward, room, or clinic name */
  @Column({ length: 200, nullable: true })
  location: string;

  /** Cycle number within the overall regimen */
  @Column({ type: 'int', nullable: true })
  cycle_number: number;

  /** Session number within this cycle */
  @Column({ type: 'int', nullable: true })
  session_number: number;

  /** Total sessions planned */
  @Column({ type: 'int', nullable: true })
  total_sessions: number;

  /** Human-readable pre-requirements, e.g. "CBC labs required 24h before. Fasting from midnight." */
  @Column({ type: 'text', nullable: true })
  pre_requirements: string;

  @Column({ length: 200, nullable: true })
  attending_staff: string;

  /** scheduled | confirmed | in_progress | completed | cancelled | missed | postponed */
  @Column({ length: 30, default: 'scheduled' })
  status: string;

  @Column({ default: false })
  reminder_sent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  reminder_sent_at: Date | null;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string;

  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
