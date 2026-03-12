import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  BOTH = 'both',
}

@Entity('notifications')
@Index(['recipient_username', 'is_read'])
@Index(['created_at'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  recipient_username: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 50, default: 'info' })
  type: string;

  @Column({ length: 50, default: 'general' })
  category: string;

  @Column({ length: 255, nullable: true })
  action_url: string | null;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  @Column({ default: false })
  is_read: boolean;

  @Column({ default: false })
  email_sent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
