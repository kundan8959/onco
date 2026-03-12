import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('medical_history')
export class MedicalHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id', unique: true })
  patient_id: number;

  @Column({ length: 50, default: 'none' })
  mother_condition: string;

  @Column({ length: 200, nullable: true })
  mother_condition_other: string;

  @Column({ length: 50, default: 'none' })
  father_condition: string;

  @Column({ length: 200, nullable: true })
  father_condition_other: string;

  @Column({ type: 'text', nullable: true })
  additional_family_history: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
