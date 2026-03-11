import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('medications')
@Index(['patient', 'is_active'])
export class Medication {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patient_id: number;

  @Column({ length: 200 })
  medicine_name: string;

  @Column({ length: 100 })
  dosage: string;

  @Column({ length: 20 })
  frequency: string;

  @Column({ length: 50, nullable: true })
  route: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ length: 200, nullable: true })
  prescribed_by: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ length: 20, default: 'manual' })
  data_source: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
