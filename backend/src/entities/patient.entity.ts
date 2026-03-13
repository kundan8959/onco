import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, OneToOne, Index, BeforeInsert,
} from 'typeorm';
import * as crypto from 'crypto';

// Same patient (same email) may be registered at multiple hospitals;
// uniqueness is enforced per (email, hospital_name) pair.
// MRN is also unique per hospital, not globally.
@Index(['email', 'hospital_name'], { unique: true })
@Index(['medical_record_number', 'hospital_name'], { unique: true })
@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20 })
  medical_record_number: string;

  // Personal Information
  @Column({ length: 100 })
  first_name: string;

  @Column({ length: 100 })
  last_name: string;

  @Column({ type: 'date' })
  date_of_birth: string;

  @Column({ length: 1 })
  gender: string; // M, F, O

  @Column({ length: 50, nullable: true })
  gender_other: string;

  @Column({ length: 3 })
  blood_group: string;

  @Column({ length: 20, nullable: true })
  marital_status: string;

  // Contact — non-unique index kept for search performance; uniqueness is at the
  // composite level (email + hospital_name) via the class-level @Index above.
  @Index()
  @Column()
  email: string;

  @Index()
  @Column({ length: 15 })
  contact_number: string;

  @Column({ length: 15, nullable: true })
  emergency_contact_phone: string;

  @Column({ nullable: true })
  emergency_contact_email: string;

  @Column({ length: 150, nullable: true })
  emergency_contact_name_relation: string;

  // Address
  @Column({ length: 255 })
  street_address: string;

  @Column({ length: 255, nullable: true })
  street_address_line2: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 2 })
  state: string;

  @Column({ length: 10 })
  zip_code: string;

  @Column({ length: 50, default: 'USA' })
  country: string;

  // Additional
  @Column({ length: 100, nullable: true })
  profession: string;

  @Column({ length: 20, default: 'non_insured' })
  insurance_status: string;

  // Dates
  @Column({ type: 'date', nullable: true })
  registration_date: string;

  @Column({ type: 'date', nullable: true })
  last_visit_date: string;

  // Status
  @Column({ length: 150, nullable: true })
  hospital_name: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations (defined by related entities)

  @BeforeInsert()
  generateMRN() {
    if (!this.medical_record_number) {
      this.medical_record_number = `MRN${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    }
    if (!this.registration_date) {
      this.registration_date = new Date().toISOString().split('T')[0];
    }
  }

  // Computed properties
  get full_name(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  get age(): number | null {
    if (!this.date_of_birth) return null;
    const today = new Date();
    const dob = new Date(this.date_of_birth);
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }
}
