import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { OncologyRecord } from './oncology-record.entity';

@Entity('oncology_symptom_reports')
@Index(['oncology_record', 'reported_date'])
@Index(['severity', 'progression'])
export class OncologySymptomReport {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OncologyRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oncology_record_id' })
  oncology_record: OncologyRecord;

  @Column({ name: 'oncology_record_id' })
  oncology_record_id: number;

  @Column({ length: 200 })
  symptom_name: string;

  @Column({ length: 20, default: 'mild' })
  severity: string;

  @Column({ type: 'date' })
  onset_date: string;

  @Column({ length: 20, default: 'stable' })
  progression: string;

  @Column({ type: 'int', nullable: true })
  pain_score: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ type: 'date', nullable: true })
  reported_date: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
