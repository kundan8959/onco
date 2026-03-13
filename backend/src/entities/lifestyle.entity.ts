import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('lifestyle')
export class Lifestyle {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id', unique: true })
  patient_id: number;

  @Column({ length: 20, default: 'never' })
  smoking_status: string;

  @Column({ type: 'date', nullable: true })
  smoking_quit_date: string;

  @Column({ length: 20, default: 'never' })
  alcohol_use: string;

  @Column({ length: 20, default: 'sedentary' })
  physical_activity: string;

  @Column({ length: 200, nullable: true })
  exercise_type: string;

  @Column({ length: 20, default: 'regular' })
  diet_type: string;

  @Column({ type: 'text', nullable: true })
  diet_notes: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  sleep_hours: number;

  @Column({ length: 20, nullable: true })
  sleep_quality: string;

  @Column({ length: 20, nullable: true })
  stress_level: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
