import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('vitals')
@Index(['patient', 'recorded_date'])
export class Vitals {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patient_id: number;

  @Column({ type: 'int' })
  bp_systolic: number;

  @Column({ type: 'int' })
  bp_diastolic: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  diabetes: number; // blood sugar

  @Column({ type: 'int' })
  spo2: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  height: number; // cm

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight: number; // kg

  @Column({ type: 'timestamp' })
  recorded_date: Date;

  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ length: 20, default: 'manual' })
  data_source: string;

  @CreateDateColumn()
  created_at: Date;

  get bmi(): number | null {
    if (this.height && this.weight) {
      const heightM = Number(this.height) / 100;
      return Math.round((Number(this.weight) / (heightM * heightM)) * 100) / 100;
    }
    return null;
  }
}
