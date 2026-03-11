import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  HOSPITAL = 'hospital',
  PATIENT = 'patient',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 150 })
  username: string;

  @Column()
  password: string;

  @Column({ length: 100, nullable: true })
  first_name: string;

  @Column({ length: 100, nullable: true })
  last_name: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role: UserRole;

  @Column({ length: 150, nullable: true })
  hospital_name: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_staff: boolean;

  @Column({ default: false })
  is_superuser: boolean;

  @CreateDateColumn()
  created_at: Date;

  @BeforeInsert()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
  }

  get full_name(): string {
    return `${this.first_name || ''} ${this.last_name || ''}`.trim() || this.username;
  }
}
