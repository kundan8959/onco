import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('allergies')
@Index(['patient', 'severity'])
export class Allergy {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patient_id: number;

  @Column({ length: 200 })
  allergen: string;

  @Column({ type: 'text' })
  reaction: string;

  @Column({ length: 10, default: 'mild' })
  severity: string; // mild, moderate, severe

  @Column({ type: 'int', nullable: true })
  diagnosed_year: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ length: 20, default: 'manual' })
  data_source: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
