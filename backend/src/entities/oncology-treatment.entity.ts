import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { OncologyRecord } from './oncology-record.entity';

@Entity('oncology_treatments')
@Index(['oncology_record', 'start_date'])
export class OncologyTreatment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OncologyRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oncology_record_id' })
  oncology_record: OncologyRecord;

  @Column({ name: 'oncology_record_id' })
  oncology_record_id: number;

  @Column({ length: 50 })
  treatment_type: string;

  @Column({ length: 200, nullable: true })
  regimen_name: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date', nullable: true })
  end_date: string;

  @Column({ length: 30, default: 'unknown' })
  response: string;

  @Column({ length: 30, default: 'ready' })
  readiness_status: string;

  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  get is_ongoing(): boolean {
    return !this.end_date;
  }
}
