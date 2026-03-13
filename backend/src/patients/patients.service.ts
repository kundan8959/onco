import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import {
  Patient, Allergy, Vitals, Lifestyle, MedicalHistory,
  Medication, ChronicCondition, NotificationChannel, User, UserRole,
} from '../entities';
import { NotificationsService } from '../notifications.service';
import { AuditService } from '../audit.service';

@Injectable()
export class PatientsService {
  private assertHospitalAccess(entity: any, actor?: any) {
    if (actor?.role === 'hospital' && actor?.hospital_name && entity?.hospital_name !== actor.hospital_name) {
      throw new NotFoundException('Record not found');
    }
  }

  private getPageParams(query: any, defaultSize = 25) {
    const page = Math.max(1, Number(query?.page || 1));
    const page_size = Math.max(1, Math.min(200, Number(query?.page_size || defaultSize)));
    return { page, page_size, skip: (page - 1) * page_size };
  }

  private async paginate(repo: Repository<any>, options: any, query: any, defaultSize = 25, map?: (item: any) => any) {
    const { page, page_size, skip } = this.getPageParams(query, defaultSize);
    const [results, count] = await repo.findAndCount({ ...options, skip, take: page_size });
    return {
      count,
      page,
      page_size,
      results: map ? results.map(map) : results,
    };
  }

  constructor(
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Allergy) private allergyRepo: Repository<Allergy>,
    @InjectRepository(Vitals) private vitalsRepo: Repository<Vitals>,
    @InjectRepository(Lifestyle) private lifestyleRepo: Repository<Lifestyle>,
    @InjectRepository(MedicalHistory) private medHistRepo: Repository<MedicalHistory>,
    @InjectRepository(Medication) private medicationRepo: Repository<Medication>,
    @InjectRepository(ChronicCondition) private conditionRepo: Repository<ChronicCondition>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  // ===== PATIENTS =====
  async findAllPatients(query: any, actor?: any) {
    const { search, ordering, page = 1, page_size = 25 } = query;
    const qb = this.patientRepo.createQueryBuilder('p')
      .where('p.is_active = :active', { active: true });

    if (actor?.role === 'hospital' && actor?.hospital_name) {
      qb.andWhere('p.hospital_name = :hospital_name', { hospital_name: actor.hospital_name });
    }

    if (search) {
      qb.andWhere(
        '(p.first_name ILIKE :s OR p.last_name ILIKE :s OR p.email ILIKE :s OR p.contact_number ILIKE :s OR p.medical_record_number ILIKE :s)',
        { s: `%${search}%` },
      );
    }

    if (ordering) {
      const dir = ordering.startsWith('-') ? 'DESC' : 'ASC';
      const field = ordering.replace(/^-/, '');
      qb.orderBy(`p.${field}`, dir);
    } else {
      qb.orderBy('p.created_at', 'DESC');
    }

    const skip = (page - 1) * page_size;
    qb.skip(skip).take(page_size);

    const [results, count] = await qb.getManyAndCount();

    // Enrich with latest vitals and allergy counts
    const enriched = await Promise.all(
      results.map(async (p) => {
        const latestVitals = await this.vitalsRepo.findOne({
          where: { patient_id: p.id },
          order: { recorded_date: 'DESC' },
        });
        const allergyCount = await this.allergyRepo.count({ where: { patient_id: p.id } });
        return {
          ...p,
          full_name: p.full_name,
          age: p.age,
          latest_vitals: latestVitals || null,
          allergy_count: allergyCount,
        };
      }),
    );

    return { count, results: enriched };
  }

  async findOnePatient(id: number, actor?: any) {
    const patient = await this.patientRepo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (actor?.role === 'hospital' && actor?.hospital_name && patient.hospital_name !== actor.hospital_name)
      throw new ForbiddenException('Access denied');

    const [allergies, vitals, lifestyle, medicalHistory, medications, conditions] = await Promise.all([
      this.allergyRepo.find({ where: { patient_id: id }, order: { severity: 'DESC' } }),
      this.vitalsRepo.find({ where: { patient_id: id }, order: { recorded_date: 'DESC' } }),
      this.lifestyleRepo.findOne({ where: { patient_id: id } }),
      this.medHistRepo.findOne({ where: { patient_id: id } }),
      this.medicationRepo.find({ where: { patient_id: id }, order: { is_active: 'DESC', start_date: 'DESC' } }),
      this.conditionRepo.find({ where: { patient_id: id }, order: { status: 'ASC' } }),
    ]);

    return {
      ...patient,
      full_name: patient.full_name,
      age: patient.age,
      allergies,
      vitals: vitals.map(v => ({ ...v, bmi: v.bmi })),
      lifestyle,
      medical_history: medicalHistory,
      medications,
      chronic_conditions: conditions,
    };
  }

  async createPatient(data: Partial<Patient>, actor?: any) {
    const resolvedHospital = actor?.role === 'hospital' ? actor.hospital_name : (data.hospital_name || actor?.hospital_name || null);
    // Per-hospital uniqueness: the same email CAN exist at different hospitals.
    if (data.email) {
      const [dupPatient, existingUser] = await Promise.all([
        this.patientRepo.findOne({ where: { email: data.email, hospital_name: resolvedHospital } }),
        this.userRepo.findOne({ where: { email: data.email } }),
      ]);
      if (dupPatient) {
        throw new ConflictException('A patient with this email is already registered at this hospital');
      }
      // Only block if the existing user is a staff/admin account — patient accounts
      // are shared across hospitals and do NOT block registration.
      if (existingUser && existingUser.role !== UserRole.PATIENT) {
        throw new ConflictException('Email is already in use by a staff account');
      }
    }
    const patient = this.patientRepo.create({ ...data, hospital_name: resolvedHospital });
    const saved = await this.patientRepo.save(patient);
    await this.notificationsService.notifyMany(['superadmin', 'hospital'], {
      title: 'New patient registered',
      message: `${saved.full_name} was added to the registry.`,
      type: 'success',
      category: 'patient',
      actionUrl: `/hospital/patients`,
      channel: NotificationChannel.BOTH,
    });
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'create',
      entity_type: 'patient',
      entity_id: saved.id,
      scope: saved.full_name,
      summary: `Created patient ${saved.full_name}`,
      metadata: { mrn: saved.medical_record_number },
    });
    return saved;
  }

  async updatePatient(id: number, data: Partial<Patient>, actor?: any) {
    const patient = await this.patientRepo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    this.assertHospitalAccess(patient, actor);
    const { full_name, age, ...safeData } = (data || {}) as any;
    const oldEmail = patient.email;
    const newEmail: string | undefined = safeData.email;

    // ── Email uniqueness guard (per-hospital for patients; global for staff) ──
    if (newEmail && newEmail !== oldEmail) {
      const [dupPatient, dupUser] = await Promise.all([
        this.patientRepo.findOne({ where: { email: newEmail, hospital_name: patient.hospital_name } }),
        this.userRepo.findOne({ where: { email: newEmail } }),
      ]);
      if (dupPatient && dupPatient.id !== id) {
        throw new ConflictException('Email is already registered to another patient at this hospital');
      }
      // Block only if a non-patient (staff) account uses the new email.
      if (dupUser && dupUser.role !== UserRole.PATIENT) {
        throw new ConflictException('Email is already in use by a staff account');
      }
    }

    Object.assign(patient, safeData);
    const saved = await this.patientRepo.save(patient);

    // ── Sync changed fields to the linked User row (matched by old email) ────
    const linkedUser = await this.userRepo.findOne({ where: { email: oldEmail } });
    if (linkedUser) {
      let userDirty = false;
      if (newEmail && newEmail !== oldEmail) {
        // Only update the user's email if no OTHER hospital still has a patient
        // row pointing at oldEmail — otherwise we'd break those cross-hospital links.
        const sharedCount = await this.patientRepo.count({ where: { email: oldEmail } });
        if (sharedCount === 0) {
          linkedUser.email = newEmail;
          userDirty = true;
        }
      }
      if (safeData.first_name !== undefined && linkedUser.first_name !== safeData.first_name) {
        linkedUser.first_name = safeData.first_name; userDirty = true;
      }
      if (safeData.last_name !== undefined && linkedUser.last_name !== safeData.last_name) {
        linkedUser.last_name = safeData.last_name; userDirty = true;
      }
      if (userDirty) await this.userRepo.save(linkedUser);
    }
    await this.notificationsService.notifyMany(['superadmin', 'hospital'], {
      title: 'Patient profile updated',
      message: `${saved.full_name}'s profile was updated.`,
      type: 'info',
      category: 'patient',
      actionUrl: `/hospital/patients`,
      channel: NotificationChannel.IN_APP,
    });
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'update',
      entity_type: 'patient',
      entity_id: saved.id,
      scope: saved.full_name,
      summary: `Updated patient ${saved.full_name}`,
      metadata: { mrn: saved.medical_record_number },
    });
    return saved;
  }

  async deletePatient(id: number, actor?: any) {
    const patient = await this.patientRepo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    this.assertHospitalAccess(patient, actor);
    patient.is_active = false;
    await this.patientRepo.save(patient);
    await this.auditService.log({
      actor: actor?.username || 'system',
      actor_role: actor?.role || 'system',
      action: 'deactivate',
      entity_type: 'patient',
      entity_id: patient.id,
      scope: patient.full_name,
      summary: `Deactivated patient ${patient.full_name}`,
      metadata: { mrn: patient.medical_record_number },
      status: 'inactive',
    });
  }

  // ===== ALLERGIES =====
  async findAllAllergies(query: any, actor?: any) {
    const where: any = {};
    if (query.patient_id) where.patient_id = query.patient_id;
    if (query.severity) where.severity = query.severity;
    if (actor?.role === 'hospital' && actor?.hospital_name) where.patient = { hospital_name: actor.hospital_name };
    return this.paginate(this.allergyRepo, {
      where,
      relations: ['patient'],
      order: { severity: 'DESC', allergen: 'ASC' },
    }, query);
  }

  async createAllergy(data: Partial<Allergy>) {
    const allergy = this.allergyRepo.create(data);
    return this.allergyRepo.save(allergy);
  }

  async updateAllergy(id: number, data: Partial<Allergy>) {
    await this.allergyRepo.update(id, data);
    return this.allergyRepo.findOne({ where: { id }, relations: ['patient'] });
  }

  async deleteAllergy(id: number) {
    await this.allergyRepo.delete(id);
  }

  // ===== VITALS =====
  async findAllVitals(query: any, actor?: any) {
    const where: any = {};
    if (query.patient_id) where.patient_id = query.patient_id;
    if (actor?.role === 'hospital' && actor?.hospital_name) where.patient = { hospital_name: actor.hospital_name };
    return this.paginate(this.vitalsRepo, {
      where,
      relations: ['patient'],
      order: { recorded_date: 'DESC' },
    }, query, 25, (v: any) => ({ ...v, bmi: v.bmi }));
  }

  async createVitals(data: Partial<Vitals>, actor?: any) {
    const vitals = this.vitalsRepo.create({ ...data, hospital_name: actor?.role === 'hospital' ? actor.hospital_name : (data.hospital_name || actor?.hospital_name || null) });
    const saved = await this.vitalsRepo.save(vitals);
    await this.auditService.log({
      action: 'create',
      entity_type: 'vitals',
      entity_id: saved.id,
      scope: `patient:${saved.patient_id}`,
      summary: 'Created vitals record',
      metadata: { patient_id: saved.patient_id, recorded_date: saved.recorded_date },
    });
    return saved;
  }

  async updateVitals(id: number, data: Partial<Vitals>, actor?: any) {
    const current = await this.vitalsRepo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Vitals not found');
    this.assertHospitalAccess(current, actor);
    await this.vitalsRepo.update(id, data);
    const saved = await this.vitalsRepo.findOne({ where: { id }, relations: ['patient'] });
    if (saved) {
      await this.auditService.log({
        action: 'update',
        entity_type: 'vitals',
        entity_id: saved.id,
        scope: `patient:${saved.patient_id}`,
        summary: 'Updated vitals record',
        metadata: { patient_id: saved.patient_id, recorded_date: saved.recorded_date },
      });
    }
    return saved;
  }

  async deleteVitals(id: number, actor?: any) {
    const vitals = await this.vitalsRepo.findOne({ where: { id } });
    if (vitals) this.assertHospitalAccess(vitals, actor);
    await this.vitalsRepo.delete(id);
    if (vitals) {
      await this.auditService.log({
        action: 'delete',
        entity_type: 'vitals',
        entity_id: id,
        scope: `patient:${vitals.patient_id}`,
        summary: 'Deleted vitals record',
        metadata: { patient_id: vitals.patient_id },
      });
    }
  }

  // ===== LIFESTYLE =====
  async findAllLifestyle(query: any, actor?: any) {
    const where: any = {};
    if (query.patient_id) where.patient_id = query.patient_id;
    if (actor?.role === 'hospital' && actor?.hospital_name) where.patient = { hospital_name: actor.hospital_name };
    return this.paginate(this.lifestyleRepo, { where, relations: ['patient'] }, query);
  }

  async upsertLifestyle(data: Partial<Lifestyle>) {
    const existing = await this.lifestyleRepo.findOne({ where: { patient_id: data.patient_id } });
    if (existing) {
      Object.assign(existing, data);
      return this.lifestyleRepo.save(existing);
    }
    const lifestyle = this.lifestyleRepo.create(data);
    return this.lifestyleRepo.save(lifestyle);
  }

  async deleteLifestyle(id: number) {
    await this.lifestyleRepo.delete(id);
  }

  // ===== MEDICAL HISTORY =====
  async findAllMedicalHistory(query: any, actor?: any) {
    const where: any = {};
    if (query.patient_id) where.patient_id = query.patient_id;
    if (actor?.role === 'hospital' && actor?.hospital_name) where.patient = { hospital_name: actor.hospital_name };
    return this.paginate(this.medHistRepo, { where, relations: ['patient'] }, query);
  }

  async upsertMedicalHistory(data: Partial<MedicalHistory>) {
    const existing = await this.medHistRepo.findOne({ where: { patient_id: data.patient_id } });
    if (existing) {
      Object.assign(existing, data);
      return this.medHistRepo.save(existing);
    }
    const history = this.medHistRepo.create(data);
    return this.medHistRepo.save(history);
  }

  async deleteMedicalHistory(id: number) {
    await this.medHistRepo.delete(id);
  }

  // ===== MEDICATIONS =====
  async findAllMedications(query: any, actor?: any) {
    const where: any = {};
    if (query.patient_id) where.patient_id = query.patient_id;
    if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
    if (actor?.role === 'hospital' && actor?.hospital_name) where.patient = { hospital_name: actor.hospital_name };
    return this.paginate(this.medicationRepo, {
      where,
      relations: ['patient'],
      order: { is_active: 'DESC', start_date: 'DESC' },
    }, query);
  }

  async createMedication(data: Partial<Medication>, actor?: any) {
    const payload = {
      ...data,
      hospital_name: actor?.role === 'hospital' ? actor.hospital_name : (data.hospital_name || actor?.hospital_name || null),
      start_date: data.start_date || new Date().toISOString().slice(0, 10),
    };
    const med = this.medicationRepo.create(payload);
    const saved = await this.medicationRepo.save(med);
    const patient = await this.patientRepo.findOne({ where: { id: saved.patient_id } });
    await this.notificationsService.notifyMany(['hospital', 'patient'], {
      title: 'Medication added',
      message: `${saved.medicine_name} was added${patient ? ` for ${patient.full_name}` : ''}.`,
      type: 'info',
      category: 'medication',
      actionUrl: `/hospital/medications`,
      channel: NotificationChannel.IN_APP,
    });
    await this.auditService.log({
      action: 'create',
      entity_type: 'medication',
      entity_id: saved.id,
      scope: patient?.full_name || `patient:${saved.patient_id}`,
      summary: `Created medication ${saved.medicine_name}`,
      metadata: { patient_id: saved.patient_id, is_active: saved.is_active },
    });
    return saved;
  }

  async updateMedication(id: number, data: Partial<Medication>, actor?: any) {
    const current = await this.medicationRepo.findOne({ where: { id } });
    if (!current) throw new NotFoundException('Medication not found');
    this.assertHospitalAccess(current, actor);
    const payload = {
      ...data,
      start_date: data.start_date || undefined,
    };
    await this.medicationRepo.update(id, payload);
    const saved = await this.medicationRepo.findOne({ where: { id }, relations: ['patient'] });
    if (saved) {
      await this.auditService.log({
        action: 'update',
        entity_type: 'medication',
        entity_id: saved.id,
        scope: saved.patient?.full_name || `patient:${saved.patient_id}`,
        summary: `Updated medication ${saved.medicine_name}`,
        metadata: { patient_id: saved.patient_id, is_active: saved.is_active },
      });
    }
    return saved;
  }

  async deleteMedication(id: number, actor?: any) {
    const medication = await this.medicationRepo.findOne({ where: { id }, relations: ['patient'] });
    if (medication) this.assertHospitalAccess(medication, actor);
    await this.medicationRepo.delete(id);
    if (medication) {
      await this.auditService.log({
        action: 'delete',
        entity_type: 'medication',
        entity_id: id,
        scope: medication.patient?.full_name || `patient:${medication.patient_id}`,
        summary: `Deleted medication ${medication.medicine_name}`,
        metadata: { patient_id: medication.patient_id },
      });
    }
  }

  // ===== CHRONIC CONDITIONS =====
  async findAllConditions(query: any, actor?: any) {
    const where: any = {};
    if (query.patient_id) where.patient_id = query.patient_id;
    if (query.status) where.status = query.status;
    if (actor?.role === 'hospital' && actor?.hospital_name) where.patient = { hospital_name: actor.hospital_name };
    return this.paginate(this.conditionRepo, {
      where,
      relations: ['patient'],
      order: { status: 'ASC', diagnosed_year: 'DESC' },
    }, query);
  }

  async createCondition(data: Partial<ChronicCondition>) {
    const cond = this.conditionRepo.create(data);
    return this.conditionRepo.save(cond);
  }

  async updateCondition(id: number, data: Partial<ChronicCondition>) {
    await this.conditionRepo.update(id, data);
    return this.conditionRepo.findOne({ where: { id }, relations: ['patient'] });
  }

  async deleteCondition(id: number) {
    await this.conditionRepo.delete(id);
  }

  // ===== DASHBOARD STATS =====
  async getDashboardStats() {
    const totalPatients = await this.patientRepo.count({ where: { is_active: true } });
    const totalAllergies = await this.allergyRepo.count();
    const totalMedications = await this.medicationRepo.count({ where: { is_active: true } });
    const totalConditions = await this.conditionRepo.count({ where: { status: 'active' } });

    return {
      total_patients: totalPatients,
      total_allergies: totalAllergies,
      active_medications: totalMedications,
      active_conditions: totalConditions,
    };
  }
}
