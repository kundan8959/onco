import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  actor: string;

  @Column({ length: 100 })
  actor_role: string;

  @Column({ length: 120 })
  action: string;

  @Column({ length: 120 })
  entity_type: string;

  @Column({ nullable: true })
  entity_id: string | null;

  @Column({ length: 200, nullable: true })
  scope: string | null;

  @Column({ type: 'text', nullable: true })
  summary: string | null;

  @Column({ length: 40, default: 'ok' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @CreateDateColumn()
  created_at: Date;
}
