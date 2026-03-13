import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity('chronic_conditions')
@Index(['patient', 'status'])
@Index(['condition'])
export class ChronicCondition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'patient_id' })
  patient_id: number;

  @Column({ length: 50 })
  condition: string;

  @Column({ length: 200, nullable: true })
  condition_name_other: string;

  @Column({ type: 'int' })
  diagnosed_year: number;

  @Column({ length: 20, default: 'active' })
  status: string;

  @Column({ length: 200, nullable: true })
  diagnosed_by: string;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 20, default: 'manual' })
  data_source: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
