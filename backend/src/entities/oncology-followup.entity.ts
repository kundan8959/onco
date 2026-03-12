import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { OncologyRecord } from './oncology-record.entity';

@Entity('oncology_followups')
@Index(['oncology_record', 'followup_date'])
export class OncologyFollowUp {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OncologyRecord, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oncology_record_id' })
  oncology_record: OncologyRecord;

  @Column({ name: 'oncology_record_id' })
  oncology_record_id: number;

  @Column({ type: 'date' })
  followup_date: string;

  @Column({ default: false })
  recurrence_detected: boolean;

  @Column({ type: 'text', nullable: true })
  imaging_summary: string;

  @Column({ type: 'text', nullable: true })
  tumor_marker_summary: string;

  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
