import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('medical_reports')
@Index(['patient_id', 'status'])
export class MedicalReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patient_id: number;

  @Column({ length: 50 })
  document_type: string;

  @Column({ length: 255, nullable: true })
  original_filename: string;

  @Column({ length: 500, nullable: true })
  file_path: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  extracted_data: any;

  @Column({ type: 'jsonb', nullable: true })
  insights: any;

  @Column({ type: 'jsonb', nullable: true })
  recommendations: any;

  @Column({ type: 'int', nullable: true })
  ai_confidence_score: number;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
